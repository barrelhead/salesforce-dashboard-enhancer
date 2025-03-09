document.addEventListener('DOMContentLoaded', function() {
  const refreshToggle = document.getElementById('refreshToggle');
  const refreshStatus = document.getElementById('refreshStatus');
  const refreshInterval = document.getElementById('refreshInterval');
  const columnsCount = document.getElementById('columnsCount');
  const refreshNowBtn = document.getElementById('refreshNow');
  const openOptionsBtn = document.getElementById('openOptions');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved settings
  chrome.storage.sync.get({
    autoRefreshEnabled: false,
    refreshIntervalSeconds: 60,
    columnsCount: 0
  }, function(items) {
    refreshToggle.checked = items.autoRefreshEnabled;
    refreshStatus.textContent = items.autoRefreshEnabled ? 'On' : 'Off';
    refreshInterval.value = items.refreshIntervalSeconds;
    columnsCount.value = items.columnsCount;
  });
  
  // Toggle auto-refresh
  refreshToggle.addEventListener('change', function() {
    const isEnabled = refreshToggle.checked;
    refreshStatus.textContent = isEnabled ? 'On' : 'Off';
    
    chrome.storage.sync.set({ autoRefreshEnabled: isEnabled }, function() {
      // Send message to background script to start/stop refresh timer
      chrome.runtime.sendMessage({
        action: isEnabled ? 'startRefresh' : 'stopRefresh'
      });
      
      statusMessage.textContent = `Auto-refresh ${isEnabled ? 'enabled' : 'disabled'}`;
      setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    });
  });
  
  // Change refresh interval
  refreshInterval.addEventListener('change', function() {
    const interval = parseInt(refreshInterval.value);
    
    chrome.storage.sync.set({ refreshIntervalSeconds: interval }, function() {
      // Update the refresh interval in the background script
      chrome.runtime.sendMessage({
        action: 'updateRefreshInterval',
        interval: interval
      });
      
      statusMessage.textContent = `Refresh interval updated to ${getIntervalText(interval)}`;
      setTimeout(() => { statusMessage.textContent = ''; }, 2000);
    });
  });
  
  // Change columns count
  columnsCount.addEventListener('change', function() {
    const columns = parseInt(columnsCount.value);
    
    chrome.storage.sync.set({ columnsCount: columns }, function() {
      // Send message to content script to update columns
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && isSalesforceDashboard(tabs[0].url)) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateColumns',
            columns: columns
          });
          
          statusMessage.textContent = columns === 0 
            ? 'Restored default columns (3)'
            : `Updated to ${columns} columns`;
        } else {
          statusMessage.textContent = 'Settings saved. Open a Salesforce dashboard to apply';
        }
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
      });
    });
  });
  
  // Refresh dashboard now button
  refreshNowBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && isSalesforceDashboard(tabs[0].url)) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshDashboard' });
        statusMessage.textContent = 'Refreshing dashboard...';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
      } else {
        statusMessage.textContent = 'No Salesforce dashboard detected';
        setTimeout(() => { statusMessage.textContent = ''; }, 2000);
      }
    });
  });
  
  // Open options page
  openOptionsBtn.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // Helper functions
  function isSalesforceDashboard(url) {
    return url && (
      url.includes('salesforce.com') || 
      url.includes('force.com') || 
      url.includes('lightning.force.com')
    ) && url.includes('dashboards');
  }
  
  function getIntervalText(seconds) {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds === 60) return '1 minute';
    if (seconds < 3600) return `${seconds/60} minutes`;
    return `${seconds/3600} hour${seconds === 3600 ? '' : 's'}`;
  }
});