// Content Script - Runs on supported web pages
console.log('AI Content Generator - Content Script Loaded');

// Detect the current platform
const detectPlatform = (): string => {
  const url = window.location.href;

  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('udemy.com')) return 'udemy';
  if (url.includes('coursera.org')) return 'coursera';
  if (url.includes('medium.com')) return 'medium';
  if (url.includes('dev.to')) return 'dev.to';
  if (url.includes('hashnode.dev')) return 'hashnode';

  return 'generic';
};

// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    const platform = detectPlatform();
    console.log('Extracting content from:', platform);

    // Basic extraction (will be enhanced in BLOG-002)
    const content = {
      platform,
      title: document.title,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
    };

    sendResponse({ success: true, content });
  }

  return true;
});

// Initialize platform-specific features
const platform = detectPlatform();
if (platform !== 'generic') {
  console.log(`Platform detected: ${platform}`);
  // Future: Add platform-specific initialization
}

export {};
