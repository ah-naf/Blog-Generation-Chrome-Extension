export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <svg
        className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sources yet</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        Click the "Extract Content" button above to add content from YouTube videos, blogs, or any web page.
      </p>
    </div>
  );
}
