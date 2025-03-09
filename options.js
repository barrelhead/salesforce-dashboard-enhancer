document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const refreshEnabled = document.getElementById('refreshEnabled');
  const customInterval = document.getElementById('customInterval');
  const refreshBehavior = document.getElementById('refreshBehavior');
  const defaultColumns = document.getElementById('defaultColumns');
  const componentSpacing = document.getElementById('componentSpacing');
  const applyToAllDashboards = document.getElementById('applyToAllDashboards');
  const notifications = document.getElementById('notifications');
  const debugMode = document.getElementById('debugMode');
  const saveButton = document.getElementById('saveOptions');
  const resetButton = document.getElementById('resetOptions');
  const statusEl = document.getElementById('status');
  
  // Load saved options
  loadOptions();
  
  // Save options
  saveButton.addEventListener('click', function() {
    saveOptions();
  });
  
  // Reset options
  resetButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all options to defaults?')) {
      resetOptions();
    }
  });
  
  function loadOptions() {
    chrome.storage.sync.get({
      // Default values
      autoRefreshEnabled: false,
      refreshIntervalSeconds: 60,
      refreshBehavior: 'visual',
      columnsCount: 0,
      componentSpacing: 'default',
      applyToAllDashboards: true,
      showNotifications: true,
      debugMode: false
    }, function(items) {
      refreshEnabled.checked = items.autoRefreshEnabled;
      customInterval.value = items.refreshIntervalSeconds;
      refreshBehavior.value = items.refreshBehavior;
      defaultColumns.value = items.columnsCount;
      componentSpacing.value = items.componentSpacing;
      applyToAllDashboards.checked = items.applyToAllDashboards;
      notifications.checked = items.showNotifications;
      debugMode.checked = items.debugMode;
    });
  }
  
  function saveOptions() {
    const options = {
      autoRefreshEnabled: refreshEnabled.checked,
      refreshIntervalSeconds: parseInt(customInterval.value) || 60,
      refreshBehavior: refreshBehavior.value,
      columnsCount: parseInt(defaultColumns.value),
      componentSpacing: componentSpacing.value,
      applyToAllDashboards: applyToAllDashboards.checked,
      showNotifications: notifications.checked,
      debugMode: debugMode.checked
    };
    
    // Validate interval
    if (options.refreshIntervalSeconds < 5) {
      options.refreshIntervalSeconds = 5;
      customInterval.value = 5;
    } else if (options.refreshIntervalSeconds > 3600) {
      options.refreshIntervalSeconds = 3600;
      customInterval.value = 3600;
    }
    
    chrome.storage.sync.set(options, function() {
      // Update status
      statusEl.textContent = 'Options saved!';
      statusEl.classList.add('visible');
      
      // Notify background script of changes
      chrome.runtime.sendMessage({
        action: 'optionsUpdated',
        options: options
      });
      
      // Hide status after delay
      setTimeout(function() {
        statusEl.classList.remove('visible');
      }, 3000);
    });
  }
  
  function resetOptions() {
    const defaultOptions = {
      autoRefreshEnabled: false,
      refreshIntervalSeconds: 60,
      refreshBehavior: 'visual',
      columnsCount: 0,
      componentSpacing: 'default',
      applyToAllDashboards: true,
      showNotifications: true,
      debugMode: false
    };
    
    chrome.storage.sync.set(defaultOptions, function() {
      loadOptions();
      
      // Update status
      statusEl.textContent = 'Options reset to defaults!';
      statusEl.classList.add('visible');
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'optionsUpdated',
        options: defaultOptions
      });
      
      // Hide status after delay
      setTimeout(function() {
        statusEl.classList.remove('visible');
      }, 3000);
    });
  }
});