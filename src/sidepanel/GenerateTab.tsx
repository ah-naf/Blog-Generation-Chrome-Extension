import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Loader2, FileText, ListTodo, PenTool } from 'lucide-react';
import { blogAgent, BlogAgentState } from '@/agent/blogAgent';
import { SourceContent } from '@/shared/types';
import { useApiKeyValidation } from './hooks/useApiKeyValidation';
import { StepIndicator } from './components/StepIndicator';
import { ApiKeyWarning } from './components/ApiKeyWarning';
import { CollapsibleSection } from './components/CollapsibleSection';
import { TodoList } from './components/TodoList';
import { DraftActions } from './components/DraftActions';
import { EvaluationFeedback } from './components/EvaluationFeedback';
import { getCurrentActivityMessage, exportDraft } from './utils/generationHelpers';
import { generationStateStorage } from '@/shared/utils/storage';

interface GenerateTabProps {
  sources: SourceContent[];
  isGenerating: boolean;
  agentState: Partial<BlogAgentState>;
  onGeneratingChange: (isGenerating: boolean) => void;
  onAgentStateChange: (state: Partial<BlogAgentState>) => void;
}

export function GenerateTab({
  sources,
  isGenerating,
  agentState,
  onGeneratingChange,
  onAgentStateChange,
}: GenerateTabProps) {
  const [showTodos, setShowTodos] = useState(true);
  const [showPlan, setShowPlan] = useState(false);
  const { hasApiKey, apiProvider, validateBeforeGeneration } = useApiKeyValidation();

  // Check if all todos are completed
  const allTodosCompleted = agentState.todos && agentState.todos.length > 0 &&
    agentState.todos.every(todo => todo.status === 'completed');

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      const savedState = await generationStateStorage.load();
      if (savedState?.agentState) {
        onAgentStateChange(savedState.agentState);
      }
    };
    loadSavedState();
  }, []);

  // Save state whenever it changes (debounced to avoid too many writes)
  useEffect(() => {
    const saveState = async () => {
      if (agentState && Object.keys(agentState).length > 0) {
        await generationStateStorage.save(agentState);
      }
    };

    // Only save if there's actual content
    if (agentState.plan || agentState.draft || agentState.todos) {
      saveState();
    }
  }, [agentState]);

  // Automatically collapse todos and plan when all are completed
  useEffect(() => {
    if (allTodosCompleted) {
      setShowTodos(false);
      setShowPlan(false);
    }
  }, [allTodosCompleted]);

  const handleGenerate = async () => {
    if (sources.length === 0) return;

    // Validate API key before starting generation
    const isValid = await validateBeforeGeneration();
    if (!isValid) {
      onAgentStateChange({
        error: `No API key configured for ${apiProvider}. Please add your API key in the Settings tab before generating.`,
        currentStep: 'finished',
      });
      return;
    }

    onGeneratingChange(true);

    try {
      const inputs = { sources } as any;
      const stream = await blogAgent.stream(inputs);

      let isFirstChunk = true;
      let currentState: Partial<BlogAgentState> = {};

      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const update = (chunk as any)[nodeName] as Partial<BlogAgentState>;

        if (isFirstChunk) {
          currentState = {
            currentStep: 'analyzing_sources',
            sourceAnalysis: '',
            plan: '',
            todos: [],
            draft: '',
            ...update,
          };
          isFirstChunk = false;
        } else {
          currentState = { ...currentState, ...update };
        }

        onAgentStateChange(currentState);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      onAgentStateChange({
        ...agentState,
        error: error instanceof Error ? error.message : 'Generation failed',
        partialResults: true,
      });
    } finally {
      onGeneratingChange(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(agentState.draft || '');
  };

  const handleDownload = () => {
    exportDraft(agentState.draft || '');
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all generated content? This cannot be undone.')) {
      await generationStateStorage.clear();
      onAgentStateChange({});
    }
  };

  const hasContent = agentState.plan || agentState.draft || (agentState.todos && agentState.todos.length > 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* API Key Warning Banner */}
        {!hasApiKey && <ApiKeyWarning apiProvider={apiProvider} />}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Blog</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sources.length} source{sources.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || sources.length === 0 || !hasApiKey}
            className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Draft'}
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={agentState.currentStep || 'analyzing_sources'} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Activity Indicator */}
        {isGenerating && getCurrentActivityMessage(agentState) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {getCurrentActivityMessage(agentState)}
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {agentState.error && (
          <div className={`rounded-xl p-4 border animate-in fade-in slide-in-from-bottom-2 ${
            agentState.partialResults
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {agentState.partialResults ? '⚠️ Partial Failure' : '❌ Generation Failed'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {agentState.error}
                </p>
                {agentState.partialResults && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Some content was generated successfully. You can retry or use the partial results.
                  </p>
                )}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content Plan Section */}
        {agentState.plan && (
          <CollapsibleSection
            icon={FileText}
            title="CONTENT PLAN"
            isOpen={showPlan}
            onToggle={() => setShowPlan(!showPlan)}
          >
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentState.plan}</ReactMarkdown>
            </div>
          </CollapsibleSection>
        )}

        {/* Action Items Section */}
        {agentState.todos && agentState.todos.length > 0 && (
          <CollapsibleSection
            icon={ListTodo}
            title={`ACTION ITEMS${allTodosCompleted ? ` (${agentState.todos.length} Completed)` : ''}`}
            isOpen={!allTodosCompleted || showTodos}
            onToggle={() => setShowTodos(!showTodos)}
            headerColor={allTodosCompleted ? 'text-green-600 dark:text-green-400' : undefined}
            borderAccent={allTodosCompleted}
            canCollapse={allTodosCompleted}
          >
            <TodoList todos={agentState.todos} />
          </CollapsibleSection>
        )}

        {/* Evaluation Feedback Section */}
        {agentState.evaluation && (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <EvaluationFeedback evaluation={agentState.evaluation} />
          </div>
        )}

        {/* Generated Draft Section */}
        {agentState.draft && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className={`flex items-center gap-2 mb-4 ${
              agentState.currentStep === 'finished'
                ? 'text-green-600 dark:text-green-400'
                : 'text-primary-600 dark:text-primary-400'
            }`}>
              <PenTool className="w-4 h-4" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Generated Draft</h3>
            </div>

            {/* Action Buttons */}
            {agentState.currentStep === 'finished' && (
              <DraftActions
                draft={agentState.draft}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onRegenerate={handleGenerate}
                onClear={handleClear}
              />
            )}

            <div className="prose dark:prose-invert dark:text-[whitesmoke] prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentState.draft}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Empty States */}
        {!hasContent && !isGenerating && sources.length > 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-medium mb-1">Ready to Generate</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Click the generate button to create a blog post from your {sources.length} source{sources.length !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        {sources.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No sources selected. Please add some sources from the "Sources" tab first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
