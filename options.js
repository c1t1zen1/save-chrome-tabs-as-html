// Saves options to chrome.storage
function saveOptions() {
    var openAndClose = document.getElementById('openAndClose').checked;
    var autoSave = document.getElementById('autoSave').checked;

    chrome.storage.sync.set({
        openAndClose: openAndClose,
        autoSave: autoSave
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.classList.add('visible');
        setTimeout(function () {
            status.classList.remove('visible');
        }, 1500);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get({
        openAndClose: false,
        autoSave: false
    }, function (items) {
        document.getElementById('openAndClose').checked = items.openAndClose;
        document.getElementById('autoSave').checked = items.autoSave;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('openAndClose').addEventListener('change', saveOptions);
document.getElementById('autoSave').addEventListener('change', saveOptions);
