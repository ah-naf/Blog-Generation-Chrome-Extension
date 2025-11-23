import { BaseExtractor, MediumExtractor } from './extractors';

console.log('🚀 AI Content Generator - Content Script Loaded');
console.log('📍 Current URL:', window.location.href);

const extractors: BaseExtractor[] = [new MediumExtractor()];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    console.log('📨 Received extraction request');

    const extractor = extractors.find((e) => e.detect());

    if (extractor) {
      const result = extractor.extract();
      sendResponse(result);
    } else {
      console.log('⚠️ No extractor found for this page');
      sendResponse({
        success: false,
        error: 'No extractor available for this platform',
      });
    }
  }

  return true;
});

const detectedExtractor = extractors.find((e) => e.detect());
if (detectedExtractor) {
  console.log('🎯 Platform detected:', detectedExtractor.constructor.name);
}

export {};
