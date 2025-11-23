// Background Service Worker for Chrome Extension
console.log('AI Content Generator - Background Service Worker Initialized');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Initialize default settings
    chrome.storage.local.set({
      settings: {
        initialized: true,
        theme: 'light',
      },
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Message received:', message);

  if (message.type === 'OPEN_SIDEPANEL') {
    // Open side panel for the current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

// Handle tab updates to detect content extraction opportunities
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if URL is a supported platform
    const supportedPlatforms = [
      'youtube.com',
      'udemy.com',
      'coursera.org',
      'medium.com',
      'dev.to',
      'hashnode.dev',
    ];

    const isSupported = supportedPlatforms.some((platform) =>
      tab.url?.includes(platform)
    );

    if (isSupported) {
      console.log('Supported platform detected:', tab.url);
      // Future: Show page action or badge
    }
  }
});

export {};
