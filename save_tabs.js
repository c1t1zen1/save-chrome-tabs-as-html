// Save Tabs as HTML - Chrome Extension Service Worker

// Utility to escape HTML characters
function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Generate the HTML content string
function generateHtml(tabs) {
  const now = new Date();
  const title = `${tabs.length} Tabs Saved`;

  // Group tabs by Window
  const windows = {};
  tabs.forEach(tab => {
    if (tab.incognito) return; // Skip incognito
    if (!windows[tab.windowId]) {
      windows[tab.windowId] = [];
    }
    windows[tab.windowId].push(tab);
  });

  const windowIds = Object.keys(windows);

  // CSS Styles
  const css = `
    :root {
      --bg-color: #000000;
      --text-color: #cccccc;
      --link-color: #dddddd;
      --link-hover: #ffffff;
      --border-color: #444444;
      --card-bg: #111111;
      --accent: #0066cc;
    }
    body.light-mode {
      --bg-color: #f5f5f5;
      --text-color: #333333;
      --link-color: #0066cc;
      --link-hover: #004499;
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
    h1 { text-align: center; margin-bottom: 20px; }
    .controls {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-color);
    }
    input[type="text"] {
      padding: 10px;
      width: 300px;
      border-radius: 5px;
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      color: var(--text-color);
    }
    button {
      padding: 10px 20px;
      border-radius: 5px;
      border: none;
      background: var(--accent);
      color: white;
      cursor: pointer;
    }
    button:hover { opacity: 0.9; }
    
    .window-group {
      margin-bottom: 40px;
    }
    .window-title {
      font-size: 1.5em;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid var(--border-color);
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
      transition: transform 0.2s;
    }
    .tab-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .favicon {
      width: 16px;
      height: 16px;
      margin-top: 4px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .tab-info {
      overflow: hidden;
    }
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
    a {
      color: var(--link-color);
      text-decoration: none;
    }
    a:hover {
      color: var(--link-hover);
    }
    
    footer {
      margin-top: 50px;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
      font-size: 0.9em;
      color: #666;
      text-align: center;
    }
    .hidden { display: none; }
  `;

  // Javascript for the generated page
  const pageScript = `
    const searchInput = document.getElementById('search');
    const cards = document.querySelectorAll('.tab-card');
    const body = document.body;
    
    // Search Functionality
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      cards.forEach(card => {
        const title = card.getAttribute('data-title').toLowerCase();
        const url = card.getAttribute('data-url').toLowerCase();
        if (title.includes(term) || url.includes(term)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
    
    // Theme Toggle
    document.getElementById('toggle-theme').addEventListener('click', () => {
      body.classList.toggle('light-mode');
    });
  `;

  let htmlBody = `
    <h1>${title}</h1>
    <div class="controls">
      <input type="text" id="search" placeholder="Search tabs...">
      <button id="toggle-theme">Toggle Theme</button>
    </div>
  `;

  // Iterate Windows
  windowIds.forEach((wid, index) => {
    const winTabs = windows[wid];
    const windowLabel = windowIds.length > 1 ? `Window ${index + 1} (${winTabs.length} tabs)` : `All Tabs (${winTabs.length})`;

    htmlBody += `<div class="window-group">`;
    htmlBody += `<div class="window-title">${windowLabel}</div>`;
    htmlBody += `<div class="tabs-grid">`;

    // Iterate Tabs
    winTabs.forEach(tab => {
      const favIcon = tab.favIconUrl || '';
      const iconHtml = favIcon
        ? `<img src="${escapeHtml(favIcon)}" class="favicon" onerror="this.style.display='none'">`
        : `<span class="favicon" style="display:inline-block;"></span>`;

      const pinnedBadge = tab.pinned ? '<span style="font-size: 0.8em; margin-right: 5px;">📌</span>' : '';

      htmlBody += `
        <div class="tab-card" data-title="${escapeHtml(tab.title)}" data-url="${escapeHtml(tab.url)}">
          ${iconHtml}
          <div class="tab-info">
            <div class="tab-title">
              ${pinnedBadge}<a href="${escapeHtml(tab.url)}" target="_blank">${escapeHtml(tab.title)}</a>
            </div>
            <a class="tab-url" href="${escapeHtml(tab.url)}" target="_blank">${escapeHtml(tab.url)}</a>
          </div>
        </div>
      `;
    });

    htmlBody += `</div></div>`; // Close grid and window
  });

  // Footer
  htmlBody += `
    <footer>
      <p>Generated on ${now.toLocaleString()}</p>
      <p>${tabs.length} tabs saved from Chrome</p>
    </footer>
  `;

  // Assemble full HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  ${htmlBody}
  <script>${pageScript}</script>
</body>
</html>`;
}

// Event Listener for Extension Click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    // Fetch User Settings
    chrome.storage.sync.get({
      openAndClose: false,
      autoSave: false
    }, (settings) => {
      const htmlContent = generateHtml(tabs);
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);

      // Create filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `tabs-saved-${timestamp}.html`;

      // Download Config
      const downloadOptions = {
        url: dataUrl,
        filename: filename,
        saveAs: !settings.autoSave // Use setting (default false implies prompt)
      };

      chrome.downloads.download(downloadOptions, (downloadId) => {
        // If download fails or is cancelled, just stop.
        if (!downloadId) return;

        // Handle Open & Close option
        if (settings.openAndClose) {
          // Open the generated HTML in a new tab 
          // Note: We use the data URL here because we can't easily get the file:// path
          // of the downloaded file without user permission, and even then, opening it
          // automatically is restricted. Data URL is safer and immediate.
          chrome.tabs.create({ url: dataUrl }, (newTab) => {
            // Close all *other* tabs
            // We filter out the new tab we just created, and maybe the active one if it's different?
            // Actually, just close everything else.
            const tabsToClose = tabs
              .map(t => t.id)
              .filter(id => id !== newTab.id); // Ensure we don't close the new one if IDs collide (rare)

            // We also need to be careful not to close the "newTab" if it wasn't in the original list (it wasn't).
            // The 'tabs' array is from the query *before* we created the new tab.
            // So we can safely close all 'tabs'.

            chrome.tabs.remove(tabsToClose);
          });
        }
      });
    });
  });
});
