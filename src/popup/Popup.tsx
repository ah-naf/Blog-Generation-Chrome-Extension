import { useState } from 'react';

function Popup() {
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractContent = async () => {
    setIsExtracting(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_CONTENT',
        });
        console.log('Content extracted:', response);
      }
    } catch (error) {
      console.error('Error extracting content:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleOpenSidepanel = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
  };

  return (
    <div className="w-80 p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">AI</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            AI Content Generator
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Transform content into blogs
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleExtractContent}
          disabled={isExtracting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isExtracting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {isExtracting ? 'Extracting...' : 'Extract Current Page'}
        </button>

        <button onClick={handleOpenSidepanel} className="btn-secondary w-full">
          Open Sidepanel
        </button>

        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Settings
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}

export default Popup;
