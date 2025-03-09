(function() {
  // Configuration and state
  let config = {
    autoRefreshEnabled: false,
    refreshIntervalSeconds: 60,
    columnsCount: 0,
    componentSpacing: 'default',
    applyToAllDashboards: true,
    debugMode: false
  };
  
  // Store original column count for reset
  let originalStyleAdded = false;
  
  // Initialize dashboard enhancer
  function init() {
    log('Initializing Salesforce Dashboard Enhancer');
    
    // Load configuration
    chrome.storage.sync.get(config, function(items) {
      config = items;
      log('Configuration loaded', config);
      
      // Apply column adjustment if needed
      if (config.columnsCount > 0) {
        adjustColumns(config.columnsCount);
      }
      
      // Listen for messages from popup/background
      setupMessageListener();
      
      // Notify that content script is ready
      chrome.runtime.sendMessage({ action: 'contentScriptReady' });
    });
  }
  
  // Set up listeners for messages from popup and background script
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      switch(request.action) {
        case 'refreshDashboard':
          refreshDashboard();
          break;
        case 'updateColumns':
          if (request.columns === 0) {
            resetColumns();
          } else {
            adjustColumns(request.columns);
          }
          break;
        case 'getStatus':
          // Used by background script to check if dashboard is visible
          sendResponse({
            isDashboardPage: isDashboardPage(),
            dashboardId: getDashboardId()
          });
          return true; // Required for async sendResponse
      }
    });
  }
  
  // Check if current page is a dashboard
  function isDashboardPage() {
    return window.location.href.includes('/dashboards') ||
           document.querySelector('.dashboardContainer') !== null;
  }
  
  // Get current dashboard ID from URL
  function getDashboardId() {
    const match = window.location.href.match(/\/dashboard\/(.*?)(?:\/|$)/);
    return match ? match[1] : null;
  }
  
  // Adjust dashboard columns
  function adjustColumns(columns) {
    log(`Adjusting dashboard to ${columns} columns`);
    
    if (!originalStyleAdded) {
      // Add custom CSS
      const styleEl = document.createElement('style');
      styleEl.id = 'sf-dashboard-enhancer-styles';
      document.head.appendChild(styleEl);
      originalStyleAdded = true;
    }
    
    const styleEl = document.getElementById('sf-dashboard-enhancer-styles');
    if (!styleEl) return;
    
    // Generate CSS based on column count
    let columnWidth = Math.floor(100 / columns);
    let cssRules = `
      /* Dashboard grid adjustments */
      .dashboardContainer .grid-layout .slds-col {
        flex: 0 0 ${columnWidth}% !important;
        max-width: ${columnWidth}% !important;
      }
      
      /* Spacing adjustments */
      .dashboardContainer .grid-layout {
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
    `;
    
    // Add spacing customizations
    if (config.componentSpacing === 'compact') {
      cssRules += `
        .dashboardContainer .grid-layout .slds-col {
          padding: 0.125rem !important;
        }
      `;
    } else if (config.componentSpacing === 'tight') {
      cssRules += `
        .dashboardContainer .grid-layout .slds-col {
          padding: 0 !important;
        }
        .dashboardContainer .grid-layout {
          gap: 0.125rem !important;
        }
      `;
    }
    
    styleEl.textContent = cssRules;
    
    // Force redraw of dashboard layout
    triggerReflow();
  }
  
  // Reset columns to default
  function resetColumns() {
    log('Resetting dashboard columns to default');
    const styleEl = document.getElementById('sf-dashboard-enhancer-styles');
    if (styleEl) {
      styleEl.textContent = '';
    }
    
    // Force redraw of dashboard layout
    triggerReflow();
  }
  
  // Force layout recalculation
  function triggerReflow() {
    const dashboardContainer = document.querySelector('.dashboardContainer');
    if (dashboardContainer) {
      // This forces a reflow by temporarily modifying and reading a layout property
      const height = dashboardContainer.offsetHeight;
    }
  }
  
  // Refresh dashboard
  function refreshDashboard() {
    log('Refreshing dashboard');
    
    // Method 1: Try to click the refresh button
    const refreshButton = findRefreshButton();
    if (refreshButton) {
      log('Found refresh button, clicking it');
      refreshButton.click();
      return;
    }
    
    // Method 2: Try to locate and call the refresh API
    if (config.refreshBehavior === 'api' && typeof sforce !== 'undefined' && sforce.dashboard) {
      try {
        log('Attempting API-based refresh');
        sforce.dashboard.refreshDashboard(getDashboardId());
        return;
      } catch (e) {
        log('API refresh failed', e);
      }
    }
    
    // Method 3: Dispatch custom event (in case Salesforce has event listeners)
    log('Attempting to dispatch dashboard:refresh event');
    const event = new CustomEvent('dashboard:refresh', { bubbles: true });
    document.dispatchEvent(event);
    
    log('Refresh attempt completed');
  }
  
  // Find the refresh button element
  function findRefreshButton() {
    // Try different selectors that might match the refresh button
    const selectors = [
      'button[title="Refresh"]',
      'button[title*="refresh"]',
      'button[aria-label*="Refresh"]',
      'button.refresh-dashboard-button',
      '[data-aura-class="dashboardRefreshBtn"]',
      '[data-component-id*="dashboardRefresh"]'
    ];
    
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button) return button;
    }
    
    return null;
  }
  
  // Utility log function
  function log() {
    if (config.debugMode) {
      console.log('[Salesforce Dashboard Enhancer]', ...arguments);
    }
  }
  
  // Start initialization after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();