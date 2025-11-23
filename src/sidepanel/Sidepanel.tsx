import { useState } from 'react';

type Tab = 'sources' | 'generate' | 'chat' | 'settings';

function Sidepanel() {
  const [activeTab, setActiveTab] = useState<Tab>('sources');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sources', label: 'Sources' },
    { id: 'generate', label: 'Generate' },
    { id: 'chat', label: 'Chat' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
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
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Extracted Sources
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No sources extracted yet. Visit a YouTube video, course page,
                or blog article and click "Extract Current Page" from the popup.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'generate' && (
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
        )}

        {activeTab === 'chat' && (
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
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                Quick Settings
              </h2>
              <button
                onClick={() => chrome.runtime.openOptionsPage()}
                className="btn-primary"
              >
                Open Full Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidepanel;
