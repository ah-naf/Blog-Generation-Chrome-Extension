import { BaseExtractor, MediumExtractor, GenericExtractor } from './extractors';

const extractors: BaseExtractor[] = [
  new MediumExtractor(),
  new GenericExtractor(),
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    (async () => {
      try {
        const extractor = extractors.find((e) => e.detect());

        if (extractor) {
          const result = await extractor.extract();
          sendResponse(result);
        } else {
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
    })();
  }

  return true;
});

export {};
