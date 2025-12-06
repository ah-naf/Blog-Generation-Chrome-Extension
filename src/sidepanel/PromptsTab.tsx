import { useState, useEffect } from 'react';
import { TemplateGallery } from '@/shared/components/TemplateGallery';

export function PromptsTab() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    chrome.storage.local.get(['settings'], (result) => {
      if (result.settings?.theme) {
        setTheme(result.settings.theme);
      }
    });

    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prompt Templates</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customize AI prompts used during blog generation
        </p>
      </div>
      <TemplateGallery theme={theme} />
    </div>
  );
}
