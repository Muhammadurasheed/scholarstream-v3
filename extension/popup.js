/**
 * ScholarStream Copilot - Popup Script
 * Extension popup interface
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load user profile
  chrome.storage.sync.get(['userProfile'], (result) => {
    const profile = result.userProfile;
    
    if (profile) {
      document.getElementById('profileIcon').textContent = profile.name?.[0] || 'U';
      document.getElementById('profileName').textContent = profile.name || 'User';
      document.getElementById('profileStatus').textContent = `✓ Signed in to ScholarStream`;
    } else {
      document.getElementById('profileName').textContent = 'Not signed in';
      document.getElementById('profileStatus').textContent = 'Please log in to ScholarStream';
    }
  });

  // Load stats
  chrome.storage.local.get(['applications', 'fieldsAutofilled'], (result) => {
    const applications = result.applications || [];
    const fieldsCount = result.fieldsAutofilled || 0;
    
    document.getElementById('appsTracked').textContent = applications.length;
    document.getElementById('fieldsAutofilled').textContent = fieldsCount;
  });

  // Open dashboard button
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://scholarstream.app/dashboard' });
    // For local development, use: 'http://localhost:8080/dashboard'
  });
});
