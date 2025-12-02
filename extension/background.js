/**
 * ScholarStream Copilot - Background Service Worker
 * Handles extension logic and communication
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ScholarStream Copilot] Extension installed successfully');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'syncProfile') {
    // Sync user profile from web app
    chrome.storage.sync.set({ userProfile: request.profile }, () => {
      console.log('[ScholarStream] Profile synced successfully');
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getProfile') {
    // Get stored user profile
    chrome.storage.sync.get(['userProfile'], (result) => {
      sendResponse({ profile: result.userProfile });
    });
    return true;
  }

  if (request.action === 'trackApplication') {
    // Track application progress
    chrome.storage.local.get(['applications'], (result) => {
      const applications = result.applications || [];
      applications.push(request.application);
      chrome.storage.local.set({ applications }, () => {
        console.log('[ScholarStream] Application tracked');
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// Context menu for quick actions (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scholarstream-autofill',
    title: 'Auto-fill with ScholarStream',
    contexts: ['editable']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scholarstream-autofill') {
    chrome.tabs.sendMessage(tab.id, { action: 'autofill' });
  }
});
