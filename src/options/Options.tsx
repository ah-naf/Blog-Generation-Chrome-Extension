import { useState, useEffect } from 'react';

function Options() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setTheme(result.settings.theme || 'light');
      }
    });
  }, []);

  const handleSave = () => {
    chrome.storage.local.set(
      {
        settings: {
          theme,
        },
      },
      () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure AI Content Generator
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* General Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              General Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  className="input"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          {/* API Keys Section - Placeholder */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              API Keys & Models
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API key management will be available in BLOG-004 (Multi-Model AI
              Service Layer).
            </p>
          </div>

          {/* Prompts Section - Placeholder */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Prompts & Templates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Prompt customization will be available in BLOG-006 (Customizable
              Prompt System).
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button onClick={handleSave} className="btn-primary">
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
