import { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey } from '@/shared/services/gemini';

export function SettingsTab() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  useEffect(() => {
    // Load settings from storage
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setTheme(result.settings.theme || 'light');
      }
    });

    // Load API key
    getGeminiApiKey().then((key) => {
      if (key) {
        setApiKey(key);
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

  const handleSaveApiKey = async () => {
    try {
      await setGeminiApiKey(apiKey);
      setApiKeySaved(true);
      setTimeout(() => setApiKeySaved(false), 2000);
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4 max-w-2xl">
        {/* General Settings */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            General Settings
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                className="input text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSave} className="btn-primary text-sm px-4 py-2">
                {saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            API Keys & Models
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gemini API Key
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Required for AI content refinement. Get your free API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Google AI Studio
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="input pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSaveApiKey}
                  disabled={!apiKey.trim()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {apiKeySaved ? 'Saved!' : 'Save Key'}
                </button>
              </div>
              {apiKey && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  API key configured
                </p>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Using Gemini 2.5 Flash</p>
                  <p>Latest and most advanced model optimized for high-quality content transformation. Your API key is stored locally and never sent to our servers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompts Section - Placeholder */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Prompts & Templates
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prompt customization will be available in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}
