import { useState, useEffect } from 'react';
import { getAISettings, saveAISettings, DEFAULT_AI_SETTINGS } from '@/shared/services/aiService';
import type { AISettings, AIProvider } from '@/shared/types';
import { Sun, Moon, Check, Key, Server, Bot, FileText } from 'lucide-react';
import { TemplateGallery } from '@/shared/components/TemplateGallery';

function Options() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [activeProviderTab, setActiveProviderTab] = useState<AIProvider>('gemini');

  useEffect(() => {
    // Load settings
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings) {
        setTheme(result.settings.theme || 'light');
      }
    });

    getAISettings().then(setAiSettings);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    setActiveProviderTab(aiSettings.provider);
  }, [aiSettings.provider]);

  const handleSave = async () => {
    chrome.storage.local.set({
      settings: { theme },
    });

    const newSettings = {
      ...aiSettings,
      provider: activeProviderTab,
    };
    
    await saveAISettings(newSettings);
    setAiSettings(newSettings);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateApiKey = (provider: AIProvider, key: string) => {
    setAiSettings((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: key,
      },
    }));
  };

  const updateModel = (provider: AIProvider, model: string) => {
    setAiSettings((prev) => ({
      ...prev,
      models: {
        ...prev.models,
        [provider]: model,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
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
          
          {/* Theme Selection */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
              Appearance
            </h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <button
                onClick={() => setTheme('light')}
                className={`
                  relative group p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                  ${theme === 'light'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 bg-transparent'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300
                  ${theme === 'light' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}
                `}>
                  <Sun className="w-6 h-6" />
                </div>
                <span className={`font-medium ${theme === 'light' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Light Mode
                </span>
                {theme === 'light' && (
                  <div className="absolute top-3 right-3 text-primary-500">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`
                  relative group p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                  ${theme === 'dark'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 bg-transparent'
                  }
                `}
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300
                  ${theme === 'dark' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}
                `}>
                  <Moon className="w-6 h-6" />
                </div>
                <span className={`font-medium ${theme === 'dark' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Dark Mode
                </span>
                {theme === 'dark' && (
                  <div className="absolute top-3 right-3 text-primary-500">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </button>
            </div>
          </section>

          {/* AI Provider Configuration */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              AI Provider
            </h2>

            {/* Provider Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl mb-8 overflow-x-auto max-w-2xl">
              {(['gemini', 'openai', 'groq'] as AIProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => setActiveProviderTab(provider)}
                  className={`
                    flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 capitalize flex items-center justify-center gap-2
                    ${activeProviderTab === provider
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }
                  `}
                >
                  {provider === 'gemini' && <Bot className="w-4 h-4" />}
                  {provider === 'openai' && <Server className="w-4 h-4" />}
                  {provider === 'groq' && <Server className="w-4 h-4" />}
                  {provider}
                </button>
              ))}
            </div>

            {/* Configuration Form */}
            <div className="space-y-6 animate-fadeIn max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400" />
                  API Key
                </label>
                <input
                  type="password"
                  value={aiSettings.apiKeys[activeProviderTab]}
                  onChange={(e) => updateApiKey(activeProviderTab, e.target.value)}
                  placeholder={`Enter your ${activeProviderTab} API key`}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  Your key is stored locally and never sent to our servers.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Server className="w-4 h-4 text-gray-400" />
                  Model
                </label>
                <input
                  type="text"
                  value={aiSettings.models[activeProviderTab]}
                  onChange={(e) => updateModel(activeProviderTab, e.target.value)}
                  placeholder="e.g. gpt-4o, gemini-1.5-pro"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm"
                />
              </div>

              {activeProviderTab === 'openai' && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    Base URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={aiSettings.baseUrl || ''}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    Useful for local LLMs (e.g. LM Studio, Ollama) compatible with OpenAI API.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Prompts & Templates */}
          <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
              <FileText className="w-5 h-5 text-teal-500" />
              Prompts & Templates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Customize the AI prompts used during blog generation. Edit templates, manage versions, and import/export your configurations.
            </p>
            <div style={{ minHeight: '500px' }}>
              <TemplateGallery theme={theme} />
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleSave}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg
                ${saved 
                  ? 'bg-green-500 text-white shadow-green-500/30' 
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-primary-500/30 hover:shadow-primary-500/50 transform hover:-translate-y-0.5'
                }
              `}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Options;
