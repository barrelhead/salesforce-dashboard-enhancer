// State
let refreshAlarmName = 'dashboardRefresh';
let refreshIntervalSeconds = 60;
let isRefreshEnabled = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(function() {
  console.log('Salesforce Dashboard Enhancer v1.1 installed');
  
  // Set default options
  chrome.storage.sync.get({
    autoRefreshEnabled: false,
    refreshIntervalSeconds: 60,
    refreshBehavior: 'visual',
    columnsCount: 0,
    componentSpacing: 'default',
    applyToAllDashboards: true,
    showNotifications: true,
    debugMode: false
  }, function(items) {
    // Initialize state from storage
    isRefreshEnabled = items.autoRefreshEnabled;
    refreshIntervalSeconds = items.refreshIntervalSeconds;
    
    // Start refresh if enabled
    if (isRefreshEnabled) {
      startRefreshAlarm();
    }
  });
});

// Handle alarm event
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === refreshAlarmName) {
    console.log('Dashboard refresh alarm triggered');
    refreshActiveDashboards();
  }
});

// Message handling
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'startRefresh':
      isRefreshEnabled = true;
      startRefreshAlarm();
      break;
      
    case 'stopRefresh':
      isRefreshEnabled = false;
      stopRefreshAlarm();
      break;
      
    case 'updateRefreshInterval':
      refreshIntervalSeconds = request.interval;
      if (isRefreshEnabled) {
        // Restart alarm with new interval
        stopRefreshAlarm();
        startRefreshAlarm();
      }
      break;
      
    case 'optionsUpdated':
      handleOptionsUpdate(request.options);
      break;
      
    case 'contentScriptReady':
      // Content script has loaded on a page
      console.log('Content script ready notification received');
      break;
  }
});

// Start refresh alarm
function startRefreshAlarm() {
  console.log(`Starting refresh alarm with interval: ${refreshIntervalSeconds} seconds`);
  
  chrome.alarms.create(refreshAlarmName, {
    delayInMinutes: refreshIntervalSeconds / 60,
    periodInMinutes: refreshIntervalSeconds / 60
  });
}

// Stop refresh alarm
function stopRefreshAlarm() {
  console.log('Stopping refresh alarm');
  chrome.alarms.clear(refreshAlarmName);
}

// Handle option updates
function handleOptionsUpdate(options) {
  console.log('Options updated:', options);
  
  // Update state variables
  isRefreshEnabled = options.autoRefreshEnabled;
  refreshIntervalSeconds = options.refreshIntervalSeconds;
  
  // Apply refresh changes
  if (isRefreshEnabled) {
    stopRefreshAlarm();
    startRefreshAlarm();
  } else {
    stopRefreshAlarm();
  }
}

// Refresh all active Salesforce dashboards
function refreshActiveDashboards() {
  chrome.tabs.query({}, function(tabs) {
    // Filter tabs that might contain Salesforce dashboards
    const salesforceTabs = tabs.filter(tab => {
      return tab.url && (
        tab.url.includes('salesforce.com') || 
        tab.url.includes('force.com') || 
        tab.url.includes('lightning.force.com')
      ) && tab.url.includes('dashboards');
    });
    
    // Send refresh message to each tab
    for (const tab of salesforceTabs) {
      chrome.tabs.sendMessage(tab.id, { action: 'refreshDashboard' }, function(response) {
        // Check if content script received the message
        if (chrome.runtime.lastError) {
          console.log(`Error sending refresh to tab ${tab.id}:`, chrome.runtime.lastError.message);
        }
      });
    }
  });
}