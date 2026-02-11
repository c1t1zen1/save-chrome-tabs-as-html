# Roadmap & Future Features

- [x] **Multi-Format Export**: Option in setting to save in various formats (one or more): `.md`, `CSV`, `txt`, `.pdf`, etc.
- [x] **Chronological Append**: Option in settings (toggle) to append new tabs to an existing `saved-tabs.html` file with date markers, creating a continuous historical log.
- [x] **Privacy Blocklist**: Allow users to define a blocklist of domains (e.g., `gmail.com`, `bank.com`) to exclude from the HTML export.
- [x] **Editable Dashboard**: 
    - [x] Add an "X" button to each card to remove it from the list manually.
    - [x] Ensure the dashboard state saves dynamically when items are removed.
- [x] **Bulk Restore**: Add a "Restore All" button to re-open all saved tabs (excluding deleted ones) in their original order. Restore All by date range, domain URL, or ALL Completely except deleted.
- [x] **Undo & Trash**:
    - [x] Small hidden "Trash" section at the bottom for deleted links.
    - [x] Restore button to move links back to the main list.
    - [x] "XX" button for permanent deletion.
- [x] **Page Snapshots/Previews**: Floating pop-up on hover that shows a snapshot or quick-load of the target page for rapid context checking.

# To Fix

- [ ] **Clear All History**: The "Clear All History" button doesn't work in the options page.
- [ ] **Reset View Settings**: The "Reset View Settings" button says "History cleared. Close this file and save new tabs to start fresh." instead of "View settings reset. Close this file to start fresh."

# Next Features To Implement

- [ ] **Mobile View**: Single Column View for Mobile Devices. Header section two rows high.
- [ ] **Duplicate Tab Detector**: Highlight or auto-deduplicate identical URLs across different windows to reduce noise in the dashboard.
- [ ] **Auto-Save**: Option in settings (toggle) to automatically save tabs when closing the browser.
- [ ] **Auto-Backup**: Option in settings (toggle) to automatically backup saved tabs to a remote server (e.g., Google Drive, OneDrive, etc.).
- [ ] **favicon**: Pulls favicon for "Saved Tabs" page from website URL.
- [ ] **Auto-Delete**: Option in settings (toggle) to automatically delete saved tabs after a certain amount of time.

# Advanced AI Integration

- [ ] **AI Assistant Integration**:
    - [ ] Input fields for OpenAI, Claude, or local `llama.cpp` API keys/credentials.
    - [ ] **Tab Summarization**: Summarize the content of all open tabs into a single executive summary.
    - [ ] **Contextual Explainer**: Deeper explanation of complex research tabs.
    - [ ] **Discovery**: AI-powered search for similar or alternative websites based on the current tab set.

# Additional Quality-of-Life Ideas

1.  **AI Semantic Clustering**: Automatically group tabs into categories (e.g., "Dev Tools," "Research," "Shopping") using local LLMs or simple keyword heuristics.
2.  **Tab "Staleness" Indicator**: Visual cues for "tab rot"—highlighting links that have been open for a long time without activity.
3.  **Self-Hosted Webhook Sync**: Option to POST the session data to a custom webhook (personal server/Notion/Discord) instead of just downloading a file.
4.  **Interactive Annotations**: Add quick markdown notes or custom tags to individual cards directly within the HTML dashboard, preserving your thoughts alongside the links.


# OLD CONCEPTS - IGNORE THESE FOR NOW 

- [ ] Why did this happen?

    <style>
    <![CDATA[
    a {
    text-decoration: none;
    }
    dt {
    margin-top: 10px;
    }
    ]]>
    </style>

- [ ] Update screenshots for new CSS styling.
- [x] CSS styling: take out underlining and add spacing:

    <style type="text/css">
    a {
      text-decoration: none;
    }
    dt {
      margin-top: 10px;
    }
    </style>

- [ ] Manually tweak PNG icons, especially at low resolution.
- [x] Find a suitable icon.
- [ ] Add whitespace between tabs to make the icon more clear at low resolution
- [x] Use `serializeToString` instead of `outerHTML`
  - <https://stackoverflow.com/questions/817218/how-to-get-the-entire-document-html-as-a-string>
- [x] Skip private tabs (`tab.incognito == true`).
- [x] Add sections for different windows
- [x] Add subsections for pinned/unpinned tabs
