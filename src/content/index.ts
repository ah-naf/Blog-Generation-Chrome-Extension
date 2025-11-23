import { BaseExtractor, MediumExtractor, GenericExtractor } from './extractors';

console.log('🚀 AI Content Generator - Content Script Loaded');
console.log('📍 Current URL:', window.location.href);

const extractors: BaseExtractor[] = [
  new MediumExtractor(),
  new GenericExtractor(),
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    console.log('📨 Received extraction request');

    try {
      const extractor = extractors.find((e) => e.detect());

      if (extractor) {
        console.log('✅ Found extractor:', extractor.constructor.name);
        const result = extractor.extract();
        console.log('📤 Sending result:', result);
        sendResponse(result);
      } else {
        console.log('⚠️ No extractor found for this page');
        sendResponse({
          success: false,
          error: 'No extractor available for this platform',
        });
      }
    } catch (error) {
      console.error('❌ Extraction error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
