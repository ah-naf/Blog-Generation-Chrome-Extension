import { AlertCircle } from 'lucide-react';

interface ApiKeyWarningProps {
  apiProvider: string;
}

export function ApiKeyWarning({ apiProvider }: ApiKeyWarningProps) {
  return (
    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            No API Key Configured
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
            Please add your {apiProvider || 'AI provider'} API key in the Settings tab before generating content.
          </p>
        </div>
      </div>
    </div>
  );
}
