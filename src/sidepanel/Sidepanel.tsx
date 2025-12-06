import { useState, useCallback, useEffect } from 'react';
import { SourcesTab } from './SourcesTab';
import { GenerateTab } from './GenerateTab';
import { sourceStorage, generationStateStorage } from '@/shared/utils/storage';
import type { SourceContent } from '@/shared/types';
import type { ExtractedContent } from '@/content/extractors/types';
import type { BlogAgentState } from '@/agent/blogAgent';
import { Settings } from 'lucide-react';

type Tab = 'sources' | 'generate';

function Sidepanel() {
  const [activeTab, setActiveTab] = useState<Tab>('sources');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [sources, setSources] = useState<SourceContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentState, setAgentState] = useState<Partial<BlogAgentState>>({
    currentStep: 'analyzing_sources',
    sourceAnalysis: '',
    plan: '',
    todos: [],
    draft: '',
  });

  useEffect(() => {
    const loadSources = async () => {
      const storedSources = await sourceStorage.getAll();
      setSources(storedSources);
    };
    loadSources();
  }, [refreshKey]);

  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      const hasSavedState = await generationStateStorage.hasSavedState();
      if (hasSavedState) {
        e.preventDefault();
        e.returnValue = 'You have generated content that will be lost. Are you sure you want to close?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sources', label: 'Sources' },
    { id: 'generate', label: 'Generate' },
  ];

  const handleExtractContent = async () => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXTRACT_CONTENT',
      }) as { success: boolean; content?: ExtractedContent; error?: string };

      if (response.success && response.content) {
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
        setRefreshKey((prev) => prev + 1);
        setActiveTab('sources');
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

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

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

          <div className="flex items-center gap-2">
            <button
              onClick={openOptionsPage}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Open Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
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
        </div>

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
          <GenerateTab
            sources={sources}
            isGenerating={isGenerating}
            agentState={agentState}
            onGeneratingChange={setIsGenerating}
            onAgentStateChange={setAgentState}
          />
        )}
      </div>
    </div>
  );
}

export default Sidepanel;

