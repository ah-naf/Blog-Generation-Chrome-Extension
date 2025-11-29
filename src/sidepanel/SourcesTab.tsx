import { useState, useEffect } from 'react';
import type { SourceContent } from '@/shared/types';
import { sourceStorage } from '@/shared/utils/storage';
import { refineContent } from '@/shared/services/contentRefinement';
import { SourcesHeader } from './components/SourcesHeader';
import { EmptyState } from './components/EmptyState';
import { SourceItem } from './components/SourceItem';

interface SourcesTabProps {
  onRefresh?: () => void;
}

export function SourcesTab({ onRefresh }: SourcesTabProps) {
  const [sources, setSources] = useState<SourceContent[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
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
    const allCurrentlyExpanded = expandedIds.size === sources.length && sources.length > 0;
    if (allCurrentlyExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(sources.map((s) => s.id)));
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
        // console.log('Using cached refined content for:', source.title);
        await sourceStorage.refine(source.id, source.refinedContent);
        await loadSources();
      } else {
        // No cache or force refresh, call API to refine
        // console.log(forceRefresh ? 'Force refreshing with AI for:' : 'Refining with AI for:', source.title);
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
        <div className="text-gray-500 dark:text-gray-400">Loading sources...</div>
      </div>
    );
  }

  if (sources.length === 0) {
    return <EmptyState />;
  }

  const allCurrentlyExpanded = expandedIds.size === sources.length && sources.length > 0;

  return (
    <div className="h-full flex flex-col">
      <SourcesHeader
        sourcesCount={sources.length}
        allExpanded={allCurrentlyExpanded}
        onToggleAll={toggleAllSources}
      />

      {/* Accordion list */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sources.map((source) => (
            <SourceItem
              key={source.id}
              source={source}
              isExpanded={expandedIds.has(source.id)}
              isRefining={refiningIds.has(source.id)}
              refineError={refineErrors[source.id]}
              onToggle={() => toggleSource(source.id)}
              onRemove={handleRemoveSource}
              onRefine={handleRefineContent}
              onUndoRefinement={handleUndoRefinement}
              markdownComponents={markdownComponents}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
