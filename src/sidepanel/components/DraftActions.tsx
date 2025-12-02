import { Copy, Download, RefreshCw, Trash2 } from 'lucide-react';

interface DraftActionsProps {
  draft: string;
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onClear: () => void;
}

export function DraftActions({ onCopy, onDownload, onRegenerate, onClear }: DraftActionsProps) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <button
        onClick={onCopy}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
        title="Copy to clipboard"
      >
        <Copy className="w-4 h-4" />
      </button>
      <button
        onClick={onDownload}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
        title="Export as Markdown"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        onClick={onRegenerate}
        className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
        title="Regenerate"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg transition-colors flex items-center gap-2"
        title="Clear all generated content"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
