
# Salesforce Dashboard Enhancer

![Version](https://img.shields.io/badge/version-CM1.0-purple)
![Platform](https://img.shields.io/badge/platform-Chrome-green)

Salesforce Dashboard Enhancer is a Chrome extension that improves your Salesforce Dashboard experience with real-time auto-refresh capabilities and expanded column layouts.

## 🌟 Key Features

### Auto-Refresh Dashboard
- **Real-time updates**: Keep your Salesforce Dashboards current with automatic refreshing
- **Customizable intervals**: Choose refresh frequencies from 15 seconds to 1 hour
- **On-demand refreshing**: Manually refresh dashboards with a single click

### Multi-Column Layout
- **Up to 7 columns**: Expand your dashboard view from the default 3 columns to 4, 5, 6, or 7 columns
- **Spacing options**: Choose between default, compact, or tight component spacing
- **Visual enhancements**: Subtle improvements to dashboard component styling

## 📋 Background

By default, Salesforce only allows you to refresh Dashboards daily, weekly, or monthly and displays only three components in a row. This extension removes these limitations, giving you:

- Real-time information with up-to-the-second updates
- More efficient use of screen space with up to 7 columns
- Complete control over your Salesforce Dashboard viewing experience

## 🚀 Installation

### From Chrome Web Store
*(Coming Soon)*

### Manual Installation (Developer Mode)
1. Download and unzip the extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your browser toolbar

### Extension Directory Structure
The extension files must be organized in the following directory structure:
```
salesforce-dashboard-enhancer/
├── manifest.json            # Extension configuration file
├── popup/
│   ├── popup.html           # Popup interface HTML
│   ├── popup.css            # Popup styles
│   └── popup.js             # Popup functionality
├── options/
│   ├── options.html         # Options page HTML
│   ├── options.css          # Options page styles
│   └── options.js           # Options page functionality
├── content/
│   ├── dashboard-enhancer.js   # Script that modifies dashboards
│   └── dashboard-styles.css    # Styles applied to dashboards
├── background/
│   └── background.js        # Background service worker for auto-refresh
└── icons/
    ├── icon16.png           # Extension icon (16x16px)
    ├── icon48.png           # Extension icon (48x48px)
    └── icon128.png          # Extension icon (128x128px)
```

Ensure all files are in their correct locations as the extension will not function properly if the structure is missing or not as above.

## 🔧 Usage

### Basic Usage
1. Navigate to any Salesforce Dashboard page
2. Click the extension icon in your toolbar to open the popup
3. Select your desired column count (4-7)
4. Toggle auto-refresh on/off and select refresh interval
5. Use "Refresh Dashboard Now" for immediate updates

### Advanced Options
Access advanced configuration by clicking "Advanced Options" in the popup:

- **Auto-Refresh Settings**:
  - Custom refresh intervals (in seconds)
  - Refresh behavior configuration

- **Display Settings**:
  - Default column count
  - Component spacing preferences
  - Apply settings to all dashboards

- **Advanced**:
  - Notification preferences
  - Debug mode for troubleshooting

## ⚙️ Configuration Options

### Auto-Refresh
| Option | Description | Default |
|--------|-------------|---------|
| Enable Auto-Refresh | Automatically refresh dashboard at set intervals | Off |
| Refresh Interval | Time between refreshes (15 sec - 1 hour) | 60 seconds |
| Refresh Behavior | Method used to refresh the dashboard | Visual |

### Display
| Option | Description | Default |
|--------|-------------|---------|
| Column Count | Number of columns to display (3-7) | 3 (Salesforce Default) |
| Component Spacing | Space between dashboard components | Default |
| Apply to All Dashboards | Use the same settings across all dashboards | On |

## 📝 Release Notes

### Version CM1.0 (Initial Release)
- Auto-refresh functionality with customizable intervals
- Support for 4, 5, 6, or 7 column layouts
- Advanced configuration options
- Visual enhancements for dashboard components
- Intelligent dashboard detection

## 🐞 Troubleshooting

**Extension not working on all Salesforce pages**
- The extension is designed to work only on Salesforce Dashboard pages
- Make sure you're on a page with URL containing "/dashboards"

**Auto-refresh not working**
- Check if auto-refresh is enabled in the popup
- Try using "Refresh Dashboard Now" to verify the refresh functionality
- Enable Debug Mode in Advanced Options and check console for errors

**Column layout not changing**
- Refresh the page after changing column settings
- Some custom Salesforce implementations may override our layout changes

## 🔒 Privacy & Permissions

This extension requests the following permissions:
- **storage**: To save your preferences
- **alarms**: Required for the auto-refresh timer functionality
- **Access to Salesforce domains**: To interact with dashboard elements

The extension does not collect, store, or transmit any of your Salesforce data.
---

*This extension is not officially associated with or endorsed by Salesforce.*
