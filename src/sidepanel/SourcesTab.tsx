import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SourceContent } from '@/shared/types';
import { sourceStorage } from '@/shared/utils/storage';
import { refineContent } from '@/shared/services/gemini';

interface SourcesTabProps {
  onRefresh?: () => void;
}

export function SourcesTab({ onRefresh }: SourcesTabProps) {
  const [sources, setSources] = useState<SourceContent[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [allExpanded, setAllExpanded] = useState(false);
  const [refiningIds, setRefiningIds] = useState<Set<string>>(new Set());
  const [refineErrors, setRefineErrors] = useState<Record<string, string>>({});

  // Load sources on mount
  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    setIsLoading(true);
    try {
      const allSources = await sourceStorage.getAll();
      setSources(allSources);
      // Auto-expand first source
      if (allSources.length > 0) {
        setExpandedIds(new Set([allSources[0].id]));
      }
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSource = async (id: string) => {
    try {
      await sourceStorage.remove(id);
      await loadSources();
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRefresh?.();
    } catch (error) {
      console.error('Failed to remove source:', error);
    }
  };

  const toggleSource = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllSources = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedIds(new Set(sources.map((s) => s.id)));
      setAllExpanded(true);
    }
  };

  const handleRefineContent = async (source: SourceContent, forceRefresh = false) => {
    setRefiningIds((prev) => new Set(prev).add(source.id));
    setRefineErrors((prev) => {
      const next = { ...prev };
      delete next[source.id];
      return next;
    });

    try {
      // Check if we should use cache or force refresh
      if (source.refinedContent && !forceRefresh) {
        // Use cached result instead of calling API
        console.log('Using cached refined content for:', source.title);
        await sourceStorage.refine(source.id, source.refinedContent);
        await loadSources();
      } else {
        // No cache or force refresh, call API to refine
        console.log(forceRefresh ? 'Force refreshing with AI for:' : 'Refining with AI for:', source.title);
        const result = await refineContent({
          title: source.title,
          author: source.author,
          platform: source.platform,
          rawContent: source.originalContent || source.content,
          images: source.images,
        });

        if (result.success && result.refinedContent) {
          await sourceStorage.refine(source.id, result.refinedContent);
          await loadSources();
        } else {
          setRefineErrors((prev) => ({
            ...prev,
            [source.id]: result.error || 'Failed to refine content',
          }));
        }
      }
    } catch (error) {
      console.error('Error refining content:', error);
      setRefineErrors((prev) => ({
        ...prev,
        [source.id]:
          error instanceof Error ? error.message : 'Failed to refine content',
      }));
    } finally {
      setRefiningIds((prev) => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }
  };

  const handleUndoRefinement = async (sourceId: string) => {
    try {
      await sourceStorage.undoRefinement(sourceId);
      await loadSources();
      setRefineErrors((prev) => {
        const next = { ...prev };
        delete next[sourceId];
        return next;
      });
    } catch (error) {
      console.error('Error undoing refinement:', error);
    }
  };

  // Custom markdown components to handle images with base64
  const markdownComponents = {
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      // Find the source that contains this markdown
      const currentSource = sources.find((s) => expandedIds.has(s.id));

      // If src is a URL and we have a base64 version, use it
      if (src && currentSource?.images?.[src]) {
        return (
          <img
            src={currentSource.images[src]}
            alt={alt || ''}
            className="max-w-full h-auto rounded-lg my-4"
            loading="lazy"
          />
        );
      }

      // Otherwise use the src as-is (might already be base64)
      return (
        <img
          src={src}
          alt={alt || ''}
          className="max-w-full h-auto rounded-lg my-4"
          loading="lazy"
        />
      );
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading sources...</div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sources yet</h3>
        <p className="text-gray-600 max-w-md">
          Click the "Extract Content" button above to add content from YouTube videos, blogs, or any web page.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Sources ({sources.length})
          </h3>
          <button
            onClick={toggleAllSources}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors font-medium"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {sources.map((source) => {
            const isExpanded = expandedIds.has(source.id);

            return (
              <div key={source.id} className="bg-white">
                {/* Accordion header */}
                <div
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isExpanded ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => toggleSource(source.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Expand/Collapse icon */}
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${
                          isExpanded ? 'transform rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>

                      {/* Source info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            {source.platform}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(source.extractedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                          {source.title}
                        </h4>
                        {source.author && (
                          <p className="text-xs text-gray-600">By {source.author}</p>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSource(source.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove source"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Accordion content */}
                {isExpanded && (
                  <div className="px-4 pb-6 bg-gray-50 border-t border-gray-100">
                    <div className="max-w-4xl">
                      {/* Action bar */}
                      <div className="flex items-center justify-between gap-3 pt-3 pb-2">
                        {/* URL link */}
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View original
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>

                        {/* Refine/Undo buttons */}
                        <div className="flex items-center gap-2">
                          {source.isRefined ? (
                            <>
                              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Refined
                              </span>
                              {source.refinedContent && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRefineContent(source, true);
                                  }}
                                  disabled={refiningIds.has(source.id)}
                                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors font-medium flex items-center gap-1"
                                  title="Regenerate refined content with AI"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                  Refresh
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUndoRefinement(source.id);
                                }}
                                className="text-xs px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors font-medium flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                  />
                                </svg>
                                Undo
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefineContent(source);
                              }}
                              disabled={refiningIds.has(source.id)}
                              className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md transition-colors font-medium flex items-center gap-1.5"
                            >
                              {refiningIds.has(source.id) ? (
                                <>
                                  {source.refinedContent ? (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Loading from cache...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
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
                                      Refining with AI...
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {source.refinedContent ? (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                      Re-Refine (Cached)
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                      </svg>
                                      Refine with AI
                                    </>
                                  )}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Error message */}
                      {refineErrors[source.id] && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{refineErrors[source.id]}</span>
                        </div>
                      )}

                      {/* Markdown content */}
                      <div className="prose prose-sm max-w-none
                        prose-headings:text-gray-900 prose-headings:font-bold prose-headings:tracking-tight
                        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-8 prose-h1:pb-2 prose-h1:border-b prose-h1:border-gray-200
                        prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-8
                        prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-6
                        prose-h4:text-base prose-h4:mb-2 prose-h4:mt-4
                        prose-p:text-gray-700 prose-p:leading-7 prose-p:mb-4 prose-p:text-sm
                        prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                        prose-strong:text-gray-900 prose-strong:font-semibold
                        prose-em:text-gray-700 prose-em:italic
                        prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                        prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                        prose-li:text-gray-700 prose-li:leading-6 prose-li:text-sm
                        prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-4 prose-blockquote:pr-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:italic prose-blockquote:text-gray-700
                        prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                        prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:my-6 prose-pre:overflow-x-auto prose-pre:shadow-lg
                        prose-hr:my-8 prose-hr:border-gray-300 prose-hr:border-t-2
                        prose-table:my-6 prose-table:border-collapse prose-table:w-full prose-table:text-sm
                        prose-thead:bg-gray-100 prose-thead:border-b-2 prose-thead:border-gray-300
                        prose-th:border prose-th:border-gray-300 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-gray-900
                        prose-td:border prose-td:border-gray-200 prose-td:p-3 prose-td:text-gray-700
                        prose-tr:border-b prose-tr:border-gray-200
                        prose-img:rounded-lg prose-img:shadow-md prose-img:my-6">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {source.content}
                        </ReactMarkdown>
                      </div>

                      {/* Images gallery (if any standalone images not in content) */}
                      {source.images && Object.keys(source.images).length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Images</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(source.images).map(([url, base64]) => (
                              <div key={url} className="rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={base64}
                                  alt=""
                                  className="w-full h-auto object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
