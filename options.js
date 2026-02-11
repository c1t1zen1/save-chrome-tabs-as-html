// Saves options to chrome.storage
function saveOptions() {
    var openAndClose = document.getElementById('openAndClose').checked;
    var autoSave = document.getElementById('autoSave').checked;
    var exportFormat = document.getElementById('exportFormat').value;
    var enableHistory = document.getElementById('enableHistory').checked;
    var blocklist = document.getElementById('blocklist').value;

    chrome.storage.sync.set({
        openAndClose: openAndClose,
        autoSave: autoSave,
        exportFormat: exportFormat,
        enableHistory: enableHistory,
        blocklist: blocklist
    }, function () {
        var status = document.getElementById('status');
        status.classList.add('visible');
        setTimeout(function () {
            status.classList.remove('visible');
        }, 1500);
    });
}

function restoreOptions() {
    chrome.storage.sync.get({
        openAndClose: false,
        autoSave: false,
        exportFormat: 'html',
        enableHistory: false,
        blocklist: ''
    }, function (items) {
        document.getElementById('openAndClose').checked = items.openAndClose;
        document.getElementById('autoSave').checked = items.autoSave;
        document.getElementById('exportFormat').value = items.exportFormat;
        document.getElementById('enableHistory').checked = items.enableHistory;
        document.getElementById('blocklist').value = items.blocklist;

        // After options load, also load history for the manager
        loadHistoryManager();
    });
}

// ==========================================
// Session History Manager
// ==========================================

function loadHistoryManager() {
    const listEl = document.getElementById('sessionList');
    const countEl = document.getElementById('historyCount');

    chrome.storage.local.get({ history: [] }, function (data) {
        const history = data.history || [];

        countEl.textContent = `${history.length} saved sessions found.`;
        listEl.innerHTML = '';

        if (history.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; color:#999; padding:10px;">No saved history.</div>';
            return;
        }

        // Display newest first
        const sortedHistory = [...history].reverse();

        sortedHistory.forEach((session, index) => {
            // Calculate original index for deletion (reverse logic)
            // original array: [0, 1, 2]
            // reversed: [2, 1, 0]
            // We need to find the session in the original array to delete it safely.
            // Using timestamp as key is safer.

            const item = document.createElement('div');
            item.style.padding = '8px';
            item.style.borderBottom = '1px solid #eee';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';

            const info = document.createElement('div');
            info.innerHTML = `<strong>${session.timestamp}</strong> <span style="color:#666; font-size:0.9em;">(${session.tabs.length} tabs)</span>`;

            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.style.padding = '4px 8px';
            delBtn.style.backgroundColor = '#cc0000';
            delBtn.style.color = 'white';
            delBtn.style.border = 'none';
            delBtn.style.borderRadius = '3px';
            delBtn.style.cursor = 'pointer';
            delBtn.style.fontSize = '0.8em';

            delBtn.onclick = function () {
                deleteSession(session.timestamp);
            };

            item.appendChild(info);
            item.appendChild(delBtn);
            listEl.appendChild(item);
        });
    });
}

function deleteSession(timestamp) {
    chrome.storage.local.get({ history: [] }, function (data) {
        let history = data.history || [];
        const initialLen = history.length;
        history = history.filter(s => s.timestamp !== timestamp);

        if (history.length !== initialLen) {
            chrome.storage.local.set({ history: history }, function () {
                showManagerStatus('Session deleted.');
                loadHistoryManager(); // Refresh list
            });
        }
    });
}

function clearAllHistory() {
    if (confirm('Are you sure you want to delete ALL saved sessions from the extension storage? This cannot be undone.')) {
        chrome.storage.local.remove('history', function () {
            showManagerStatus('All history cleared.');
            loadHistoryManager();
        });
    }
}

function showManagerStatus(msg) {
    const el = document.getElementById('managerStatus');
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 3000);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('openAndClose').addEventListener('change', saveOptions);
document.getElementById('autoSave').addEventListener('change', saveOptions);
document.getElementById('exportFormat').addEventListener('change', saveOptions);
document.getElementById('enableHistory').addEventListener('change', saveOptions);
document.getElementById('blocklist').addEventListener('input', saveOptions);
document.getElementById('clearAllHistory').addEventListener('click', clearAllHistory);
