// Save Tabs as HTML - Chrome Extension Service Worker

/**
 * Utility to escape HTML characters
 */
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Filter tabs based on blocklist
 */
function filterTabs(tabs, blocklistStr) {
  if (!blocklistStr) return tabs;
  const domains = blocklistStr.split('\n').map(d => d.trim()).filter(d => d);
  if (domains.length === 0) return tabs;

  return tabs.filter(tab => {
    try {
      const url = new URL(tab.url);
      return !domains.some(d => url.hostname.includes(d));
    } catch (e) { return true; }
  });
}

// ==========================================
// Generators
// ==========================================

function generateCsv(sessions) {
  let csv = "Date,Window,Title,URL\n";
  sessions.forEach(session => {
    const date = session.timestamp;
    session.tabs.forEach(tab => {
      const title = tab.title.replace(/"/g, '""');
      const url = tab.url.replace(/"/g, '""');
      csv += `"${date}",${tab.windowId},"${title}","${url}"\n`;
    });
  });
  return csv;
}

function generateMarkdown(sessions) {
  let md = "# Saved Tabs Export\n\n";
  sessions.forEach(session => {
    md += `## Session: ${session.timestamp}\n\n`;
    const windows = {};
    session.tabs.forEach(t => {
      if (!windows[t.windowId]) windows[t.windowId] = [];
      windows[t.windowId].push(t);
    });

    Object.keys(windows).forEach((wid, idx) => {
      md += `### Window ${idx + 1}\n`;
      windows[wid].forEach(tab => {
        md += `- [${tab.title}](${tab.url})\n`;
      });
      md += "\n";
    });
    md += "---\n\n";
  });
  return md;
}

function generateJson(sessions) {
  return JSON.stringify(sessions, null, 2);
}

function generateHtml(sessions) {
  const now = new Date();
  const fileId = `save-tabs-${now.getTime()}`;
  const title = sessions.length > 1
    ? `Saved Tabs History (${sessions.length} sessions)`
    : `${sessions[0].tabs.length} Tabs Saved`;

  const css = `
    :root {
      --bg-color: #000000;
      --text-color: #cccccc;
      --link-color: #ffffff;
      --link-hover: #dddddd;
      --border-color: #444444;
      --card-bg: #111111;
      --accent: #0066cc;
      --danger: #cc0000;
      --success: #28a745;
    }
    body.light-mode {
      --bg-color: #f5f5f5;
      --text-color: #333333;
      --link-color: #000000;
      --link-hover: #333333;
      --border-color: #cccccc;
      --card-bg: #ffffff;
    }
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      transition: background-color 0.3s, color 0.3s;
    }
    h1, h2 { text-align: center; }
    a {
      color: var(--link-color);
      text-decoration: none;
    }
    a:hover {
      color: var(--link-hover);
    }
    .controls {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
      align-items: center;
    }
    input[type="text"], select {
      padding: 10px;
      border-radius: 5px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-color);
    }
    input[type="text"] { width: 300px; }

    button {
      padding: 10px 20px;
      border-radius: 5px;
      border: none;
      background: var(--accent);
      color: white;
      cursor: pointer;
    }
    button.danger { background: var(--danger); }
    button.success { background: var(--success); }
    button:hover { opacity: 0.9; }

    .session-group { margin-bottom: 60px; }
    .session-header {
      background: var(--card-bg);
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .window-group { margin-bottom: 20px; padding-left: 20px; }
    .window-title {
      font-size: 1.2em;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid var(--border-color);
      opacity: 0.8;
    }

    .tabs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 15px;
    }

    .tab-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 10px;
      border-radius: 5px;
      display: flex;
      align-items: flex-start;
      overflow: hidden;
      transition: transform 0.2s, opacity 0.3s, max-height 0.4s ease-out;
      position: relative;
      max-height: 200px;
    }
    .tab-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .tab-card.deleted {
      display: none;
    }
    .tab-card.removing {
      opacity: 0;
      max-height: 0;
      padding: 0 10px;
      margin: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .trash-view .tab-card.deleted {
      display: flex;
      opacity: 0.5;
    }
    .trash-view .tab-card:not(.deleted) {
      display: none;
    }

    .favicon {
      width: 16px;
      height: 16px;
      margin-top: 4px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .tab-info { overflow: hidden; flex-grow: 1; }
    .tab-title {
      font-weight: bold;
      margin-bottom: 5px;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tab-url {
      font-size: 0.85em;
      color: var(--text-color);
      opacity: 0.7;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    /* Controls on card */
    .card-actions {
      margin-left: 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .tab-card:hover .card-actions { opacity: 1; }
    .action-btn {
      background: none;
      border: none;
      color: var(--text-color);
      cursor: pointer;
      font-size: 1.2em;
      padding: 2px 4px;
    }
    .action-btn:hover { color: var(--danger); }
    .restore-btn { color: var(--success); }
    .restore-btn:hover { color: var(--success); opacity: 0.8; }
    .purge-btn {
        color: var(--danger);
        font-weight: bold;
        font-size: 0.9em;
        border: 1px solid var(--danger);
        border-radius: 3px;
        padding: 0 4px;
        margin-top: 2px;
    }

    /* Preview Popover */
    .preview-popover {
        position: fixed;
        display: none;
        border: 1px solid var(--border-color);
        background: var(--bg-color);
        z-index: 1000;
        width: 400px;
        height: 300px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        border-radius: 8px;
        overflow: hidden;
        pointer-events: none;
    }
    .preview-popover iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    }

    .hidden { display: none !important; }

    .trash-view .delete-btn { display: none; }
    .trash-view .restore-btn { display: inline-block !important; }
    .trash-view .purge-btn { display: inline-block !important; }
    .purge-btn { display: none; }
    .restore-btn { display: none; }

    /* Open Filters */
    .open-filters {
        display: flex;
        gap: 10px;
        align-items: center;
        background: rgba(255,255,255,0.05);
        padding: 5px 15px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    
    footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }
    footer p { opacity: 0.5; font-size: 0.9em; }
    .clear-history-link {
        font-size: 0.7em;
        opacity: 0.3;
        color: var(--text-color);
        cursor: pointer;
        margin-top: 10px;
        display: inline-block;
    }
    .clear-history-link:hover {
        opacity: 0.6;
    }
  `;

  // JS for generated page
  const pageScript = `
    const fileId = "${fileId}";
    const searchInput = document.getElementById('search');
    const filterSession = document.getElementById('filter-session');
    const filterDomain = document.getElementById('filter-domain');
    const allCards = document.querySelectorAll('.tab-card');
    const body = document.body;
    const previewBox = document.getElementById('preview-popover');
    const trashBtn = document.getElementById('toggle-trash');
    const restoreAllBtn = document.getElementById('restore-all');
    const clearTrashBtn = document.getElementById('clear-trash');
    let isTrashView = false;
    let deletedItems = [];
    let purgedItems = [];

    // Load persisted state
    try {
      deletedItems = JSON.parse(localStorage.getItem('deleted-' + fileId) || '[]');
      purgedItems = JSON.parse(localStorage.getItem('purged-' + fileId) || '[]');
    } catch(e) {}

    function updateView() {
        const searchTerm = searchInput.value.toLowerCase();
        const sessionFilter = filterSession ? filterSession.value : 'all';
        const domainFilter = filterDomain ? filterDomain.value : 'all';

        // Use live querySelectorAll (allCards is static, some might be removed)
        document.querySelectorAll('.tab-card').forEach(card => {
            const id = card.getAttribute('data-id');

            // If purged, remove from DOM entirely
            if (purgedItems.includes(id)) {
                card.remove();
                return;
            }

            // Trash status
            if (deletedItems.includes(id)) {
                card.classList.add('deleted');
            } else {
                card.classList.remove('deleted');
            }

            // Visibility logic
            const isDeleted = card.classList.contains('deleted');
            let isVisible = (isTrashView && isDeleted) || (!isTrashView && !isDeleted);

            if (isVisible) {
                // Search filter
                const title = card.getAttribute('data-title').toLowerCase();
                const url = card.getAttribute('data-url').toLowerCase();
                if (searchTerm && !title.includes(searchTerm) && !url.includes(searchTerm)) {
                    isVisible = false;
                }

                // Session filter
                if (isVisible && sessionFilter !== 'all') {
                    const sessionGroup = card.closest('.session-group');
                    if (sessionGroup && sessionGroup.getAttribute('data-session-ts') !== sessionFilter) {
                        isVisible = false;
                    }
                }

                // Domain filter
                if (isVisible && domainFilter !== 'all') {
                    try {
                        const cardUrl = new URL(card.getAttribute('data-url'));
                        if (cardUrl.hostname !== domainFilter) {
                            isVisible = false;
                        }
                    } catch(e) {}
                }
            }

            card.style.display = isVisible ? 'flex' : 'none';
        });

        // Hide empty window groups
        document.querySelectorAll('.window-group').forEach(group => {
            const cards = Array.from(group.querySelectorAll('.tab-card'));
            const hasVisible = cards.some(c => c.style.display !== 'none');
            group.style.display = hasVisible ? 'block' : 'none';
        });

        // Hide empty sessions
        document.querySelectorAll('.session-group').forEach(group => {
            const cards = Array.from(group.querySelectorAll('.tab-card'));
            const hasVisible = cards.some(c => c.style.display !== 'none');
            group.style.display = hasVisible ? 'block' : 'none';
        });
    }

    // Initialize
    updateView();

    // Card Actions (Event Delegation)
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.tab-card');
        if (!card) return;
        const id = card.getAttribute('data-id');

        // DELETE (Move to Trash) - card should vanish with animation
        if (e.target.closest('.delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (!deletedItems.includes(id)) {
                deletedItems.push(id);
                localStorage.setItem('deleted-' + fileId, JSON.stringify(deletedItems));
                // Animate out then update
                card.classList.add('removing');
                setTimeout(() => {
                    card.classList.remove('removing');
                    card.classList.add('deleted');
                    card.style.display = 'none';
                    updateView();
                }, 400);
            }
            return;
        }

        // RESTORE (From Trash back to active)
        if (e.target.closest('.restore-btn')) {
            e.preventDefault();
            e.stopPropagation();
            deletedItems = deletedItems.filter(i => i !== id);
            localStorage.setItem('deleted-' + fileId, JSON.stringify(deletedItems));
            card.classList.add('removing');
            setTimeout(() => {
                card.classList.remove('removing');
                card.classList.remove('deleted');
                updateView();
            }, 400);
            return;
        }

        // PURGE (Permanently delete "XX")
        if (e.target.closest('.purge-btn')) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Permanently delete this tab?')) {
                if (!purgedItems.includes(id)) {
                    purgedItems.push(id);
                    localStorage.setItem('purged-' + fileId, JSON.stringify(purgedItems));
                }
                card.classList.add('removing');
                setTimeout(() => { card.remove(); updateView(); }, 400);
            }
            return;
        }
    });

    // Trash Toggle
    trashBtn.addEventListener('click', () => {
        isTrashView = !isTrashView;
        body.classList.toggle('trash-view', isTrashView);
        trashBtn.textContent = isTrashView ? "View Active Tabs" : "View Trash";
        clearTrashBtn.classList.toggle('hidden', !isTrashView);

        const filtersEl = document.querySelector('.open-filters');
        if (filtersEl) {
            filtersEl.classList.toggle('hidden', isTrashView);
        }

        updateView();
    });

    // Clear Trash (Permanent)
    clearTrashBtn.addEventListener('click', () => {
        if (!confirm('Permanently delete ALL trashed items?')) return;
        document.querySelectorAll('.tab-card.deleted').forEach(c => {
            const cid = c.getAttribute('data-id');
            if (!purgedItems.includes(cid)) purgedItems.push(cid);
            c.remove();
        });
        localStorage.setItem('purged-' + fileId, JSON.stringify(purgedItems));
        updateView();
    });

    // Restore All (Open All Visible Tabs)
    restoreAllBtn.addEventListener('click', async () => {
        const visibleLinks = [];
        document.querySelectorAll('.tab-card').forEach(card => {
            if (card.style.display !== 'none' && !card.classList.contains('deleted')) {
                const link = card.querySelector('.tab-link');
                if (link) visibleLinks.push(link.href);
            }
        });

        if (visibleLinks.length === 0) {
            alert("No visible tabs match your current filters.");
            return;
        }

        if (visibleLinks.length > 25) {
            if (!confirm('You are about to open ' + visibleLinks.length + ' tabs. This might be blocked by your browser popup blocker. Continue?')) return;
        }

        for (const url of visibleLinks) {
            window.open(url, '_blank');
            await new Promise(r => setTimeout(r, 150));
        }
    });

    // Filters
    [searchInput, filterSession, filterDomain].forEach(input => {
        if (input) {
            input.addEventListener('input', updateView);
            input.addEventListener('change', updateView);
        }
    });

    // Theme
    document.getElementById('toggle-theme').addEventListener('click', () => {
        body.classList.toggle('light-mode');
    });

    // Preview Hover
    let previewTimeout;
    document.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('mouseenter', (e) => {
            const url = link.href;
            previewTimeout = setTimeout(() => {
                const rect = link.getBoundingClientRect();
                previewBox.style.display = 'block';
                previewBox.style.top = (rect.bottom + 5) + 'px';
                let left = rect.left;
                if (left + 400 > window.innerWidth) left = window.innerWidth - 420;
                previewBox.style.left = left + 'px';
                const iframe = previewBox.querySelector('iframe');
                iframe.src = url;
            }, 800);
        });
        link.addEventListener('mouseleave', () => {
            clearTimeout(previewTimeout);
            previewBox.style.display = 'none';
            previewBox.querySelector('iframe').src = 'about:blank';
        });
    });

    // Clear History Link
    const clearHistoryLink = document.getElementById('clear-history');
    if (clearHistoryLink) {
        clearHistoryLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Clear all saved history? This cannot be undone. Your next save will start fresh.')) {
                // Clear localStorage for this file
                localStorage.removeItem('deleted-' + fileId);
                localStorage.removeItem('purged-' + fileId);
                // Show confirmation
                clearHistoryLink.textContent = 'History cleared. Close this file and save new tabs to start fresh.';
                clearHistoryLink.style.opacity = '0.8';
                clearHistoryLink.style.pointerEvents = 'none';
            }
        });
    }
  `;

  // Collect filtering data from sessions
  const sessionDates = sessions.map(s => s.timestamp);
  const allDomains = new Set();
  sessions.forEach(s => s.tabs.forEach(t => {
    try { allDomains.add(new URL(t.url).hostname); } catch (e) { }
  }));
  const domainList = Array.from(allDomains).sort();

  let htmlBody = `
    <h1>${title}</h1>
    <div class="controls">
      <input type="text" id="search" placeholder="Search title or URL...">

      <div class="open-filters">
        <label>Filters for Open All:</label>
        <select id="filter-session">
            <option value="all">All Dates</option>
            ${sessionDates.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
        <select id="filter-domain">
            <option value="all">All Domains</option>
            ${domainList.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
        <button id="restore-all" class="success">Open All Tabs</button>
      </div>

      <button id="toggle-theme">Toggle Theme</button>
      <button id="toggle-trash" style="margin-left:20px;">View Trash</button>
      <button id="clear-trash" class="danger hidden">Empty Trash</button>
    </div>

    <div id="preview-popover" class="preview-popover">
        <iframe src="about:blank"></iframe>
    </div>
  `;

  const sortedSessions = [...sessions].reverse();

  sortedSessions.forEach((session) => {
    htmlBody += `<div class="session-group" data-session-ts="${session.timestamp}">`;
    if (sessions.length > 1) {
      htmlBody += `<div class="session-header"><h2>Session: ${session.timestamp}</h2></div>`;
    }

    const windows = {};
    session.tabs.forEach(tab => {
      if (!windows[tab.windowId]) windows[tab.windowId] = [];
      windows[tab.windowId].push(tab);
    });

    Object.keys(windows).forEach((wid, wIdx) => {
      const winTabs = windows[wid];
      htmlBody += `<div class="window-group">
            <div class="window-title">Window ${wIdx + 1} (${winTabs.length} tabs)</div>
            <div class="tabs-grid">`;

      winTabs.forEach((tab, tIdx) => {
        const favIcon = tab.favIconUrl || '';
        const uniqueId = `${session.timestamp}-${tab.windowId}-${tab.index}-${tIdx}`;

        htmlBody += `
            <div class="tab-card" data-id="${uniqueId}" data-title="${escapeHtml(tab.title)}" data-url="${escapeHtml(tab.url)}">
                ${favIcon ? `<img src="${escapeHtml(favIcon)}" class="favicon" onerror="this.style.display='none'">` : ''}
                <div class="tab-info">
                    <div class="tab-title">
                        ${tab.pinned ? '📌 ' : ''}<a href="${escapeHtml(tab.url)}" target="_blank" class="tab-link">${escapeHtml(tab.title)}</a>
                    </div>
                    <a class="tab-url" href="${escapeHtml(tab.url)}" target="_blank">${escapeHtml(tab.url)}</a>
                </div>
                <div class="card-actions">
                    <button class="action-btn delete-btn" title="Move to Trash">✕</button>
                    <button class="action-btn restore-btn" title="Restore">↺</button>
                    <button class="action-btn purge-btn" title="Delete Permanently">XX</button>
                </div>
            </div>`;
      });
      htmlBody += `</div></div>`;
    });
    htmlBody += `</div>`;
  });

  htmlBody += `
    <footer>
      <p>Generated on ${now.toLocaleString()}</p>
      <a href="#" id="clear-history" class="clear-history-link">reset view settings</a>
    </footer>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  ${htmlBody}
  <script>${pageScript}<\/script>
</body>
</html>`;
}


// ==========================================
// Main Extension Listener
// ==========================================

chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({}, (tabs) => {

    // Fetch Settings
    chrome.storage.sync.get({
      openAndClose: false,
      autoSave: false,
      exportFormat: 'html',
      enableHistory: false,
      blocklist: ''
    }, (settings) => {

      // 1. Filter Tabs
      const cleanTabs = filterTabs(tabs, settings.blocklist);

      // 2. Prepare Session Data
      const now = new Date();
      const currentSession = {
        timestamp: now.toLocaleString(),
        isoDate: now.toISOString(),
        tabs: cleanTabs
      };

      // 3. Handle History Logic
      if (settings.enableHistory) {
        chrome.storage.local.get({ history: [] }, (data) => {
          const history = data.history || [];
          history.push(currentSession);

          // Save back to storage
          chrome.storage.local.set({ history: history });

          // Export ALL history — always to the same fixed filename
          processExport(history, settings, true);
        });
      } else {
        // Just export current session
        processExport([currentSession], settings, false);
      }
    });

    function processExport(sessions, settings, isHistory) {
      let content = "";
      let filename = "";
      let mime = "";

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      switch (settings.exportFormat) {
        case 'md':
          content = generateMarkdown(sessions);
          filename = isHistory ? `tabs-history.md` : `tabs-export-${timestamp}.md`;
          mime = "text/markdown";
          break;
        case 'csv':
          content = generateCsv(sessions);
          filename = isHistory ? `tabs-history.csv` : `tabs-export-${timestamp}.csv`;
          mime = "text/csv";
          break;
        case 'json':
          content = generateJson(sessions);
          filename = isHistory ? `tabs-history.json` : `tabs-export-${timestamp}.json`;
          mime = "application/json";
          break;
        case 'html':
        default:
          content = generateHtml(sessions);
          filename = isHistory ? `tabs-history.html` : `tabs-dashboard-${timestamp}.html`;
          mime = "text/html";
          break;
      }

      // 5. Download
      const dataUrl = `data:${mime};charset=utf-8,` + encodeURIComponent(content);

      // History mode: always auto-save (overwrite same file), no Save As dialog
      const shouldPrompt = isHistory ? false : !settings.autoSave;

      chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: shouldPrompt,
        conflictAction: isHistory ? 'overwrite' : 'uniquify'
      }, (downloadId) => {
        if (!downloadId) return;

        // Open the actual saved file (not the data URL)
        if (settings.openAndClose && settings.exportFormat === 'html') {
          // Listen for the download to complete, then open the real file
          chrome.downloads.onChanged.addListener(function listener(delta) {
            if (delta.id !== downloadId) return;
            if (delta.state && delta.state.current === 'complete') {
              chrome.downloads.onChanged.removeListener(listener);

              // Get the actual file path from the download
              chrome.downloads.search({ id: downloadId }, (results) => {
                if (results && results[0] && results[0].filename) {
                  // Convert local path to file:// URL
                  const filePath = results[0].filename.replace(/\\/g, '/');
                  const fileUrl = 'file:///' + filePath;

                  chrome.tabs.create({ url: fileUrl }, (newTab) => {
                    const tabsToClose = tabs.map(t => t.id).filter(id => id !== newTab.id);
                    chrome.tabs.remove(tabsToClose);
                  });
                }
              });
            }
          });
        }
      });
    }

  });
});
