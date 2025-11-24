import { useState, useCallback } from 'react';
import { SourcesTab } from './SourcesTab';
import { SettingsTab } from './SettingsTab';
import { sourceStorage } from '@/shared/utils/storage';
import type { SourceContent } from '@/shared/types';
import type { ExtractedContent } from '@/content/extractors/types';

type Tab = 'sources' | 'generate' | 'chat' | 'settings';

function Sidepanel() {
  const [activeTab, setActiveTab] = useState<Tab>('sources');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sources', label: 'Sources' },
    { id: 'generate', label: 'Generate' },
    { id: 'chat', label: 'Chat' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleExtractContent = async () => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_CONTENT',
      }) as { success: boolean; content?: ExtractedContent; error?: string };

      if (response.success && response.content) {
        // Convert to SourceContent format and save
        const source: SourceContent = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          platform: response.content.platform,
          title: response.content.title,
          author: response.content.author,
          content: response.content.content,
          url: response.content.url,
          extractedAt: response.content.extractedAt,
          images: response.content.images,
        };

        await sourceStorage.add(source);
        setRefreshKey((prev) => prev + 1); // Trigger refresh
        setActiveTab('sources'); // Switch to sources tab
      } else {
        throw new Error(response.error || 'Failed to extract content');
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      setExtractionError(
        error instanceof Error ? error.message : 'Failed to extract content'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white">
                AI Content Generator
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Transform content into blogs
              </p>
            </div>
          </div>

          {/* Extract Content Button */}
          <button
            onClick={handleExtractContent}
            disabled={isExtracting}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Extracting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Extract Content
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {extractionError && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            {extractionError}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'sources' && (
          <SourcesTab key={refreshKey} onRefresh={handleRefresh} />
        )}

        {activeTab === 'generate' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Generate Blog
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Blog generation will be available in BLOG-005 (Deep Agent
                  Pattern Engine).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  Chat Refinement
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chat-based content refinement will be available in BLOG-007.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

export default Sidepanel;
