interface SourcesHeaderProps {
  sourcesCount: number;
  allExpanded: boolean;
  onToggleAll: () => void;
}

export function SourcesHeader({ sourcesCount, allExpanded, onToggleAll }: SourcesHeaderProps) {
  return (
    <div className="sticky top-0 z-10 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Sources ({sourcesCount})
        </h3>
        <button
          onClick={onToggleAll}
          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors font-medium"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
    </div>
  );
}
