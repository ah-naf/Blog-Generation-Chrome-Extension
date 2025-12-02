import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, CheckCircle2, Loader2, Search, FileText, ListTodo, PenTool, Circle, ChevronDown, ChevronUp, Copy, Download, RefreshCw, PlayCircle, Wand2 } from 'lucide-react';
import { blogAgent, BlogAgentState, TodoItem } from '@/agent/blogAgent';
import { SourceContent } from '@/shared/types';
import { checkpointStorage } from '@/shared/utils/storage';

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
  const [hasCheckpoint, setHasCheckpoint] = useState(false);

  // Check if all todos are completed
  const allTodosCompleted = agentState.todos && agentState.todos.length > 0 &&
    agentState.todos.every(todo => todo.status === 'completed');

  // Check for checkpoint on mount
  useEffect(() => {
    const checkForCheckpoint = async () => {
      const hasValid = await checkpointStorage.hasValidCheckpoint();
      
      // If we have a valid checkpoint, check if it's finished
      if (hasValid) {
        const checkpoint = await checkpointStorage.get();
        if (checkpoint && checkpoint.state.currentStep === 'finished') {
          // Restore finished state immediately
          onAgentStateChange(checkpoint.state);
          setHasCheckpoint(false); // Don't show resume banner
          return;
        }
      }
      
      setHasCheckpoint(hasValid);
    };
    checkForCheckpoint();
  }, []);

  // Automatically collapse todos and plan when all are completed
  useEffect(() => {
    if (allTodosCompleted) {
      setShowTodos(false);
      setShowPlan(false);
    }
  }, [allTodosCompleted]);

  const handleGenerate = async () => {
    if (sources.length === 0) return;

    // Clear any existing checkpoint when starting new generation
    await checkpointStorage.clear();
    setHasCheckpoint(false);

    onGeneratingChange(true);

    try {
      const inputs = { sources } as any;
      const stream = await blogAgent.stream(inputs);

      let isFirstChunk = true;
      let currentState: Partial<BlogAgentState> = {};

      for await (const chunk of stream) {
        // The chunk contains the update from the last node
        const nodeName = Object.keys(chunk)[0];
        const update = (chunk as any)[nodeName] as Partial<BlogAgentState>;

        // Clear old state on first chunk to prevent flash
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
          currentState = {
            ...currentState,
            ...update,
          };
        }

        onAgentStateChange(currentState);
      }

      // The last chunk from executeDraftNode already sets currentStep: 'finished'
      // No need to update again here
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

  const handleRetry = () => {
    handleGenerate();
  };

  const handleResume = async () => {
    const checkpoint = await checkpointStorage.get();
    if (!checkpoint) return;

    // Restore state from checkpoint
    onAgentStateChange(checkpoint.state);
    setHasCheckpoint(false);

    // Continue generation from where it left off
    onGeneratingChange(true);

    try {
      // Re-run from current step based on checkpoint state
      const currentState = checkpoint.state;
      const inputs = { sources: currentState.sources };
      const stream = await blogAgent.stream(inputs);

      // Skip to the current step by consuming the stream up to that point
      let isResuming = true;
      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const update = (chunk as any)[nodeName] as Partial<BlogAgentState>;

        // If we're resuming and haven't caught up to checkpoint yet, skip updates
        if (isResuming) {
          // Check if we've caught up by comparing steps
          const stepOrder = ['analyzing_sources', 'creating_plan', 'creating_todos', 'executing_draft', 'refining', 'finished'];
          const checkpointStepIndex = stepOrder.indexOf(currentState.currentStep);
          const currentStepIndex = stepOrder.indexOf(update.currentStep || 'analyzing_sources');

          if (currentStepIndex >= checkpointStepIndex) {
            isResuming = false;
          } else {
            continue; // Skip this update
          }
        }

        onAgentStateChange({
          ...currentState,
          ...update,
        });
      }
    } catch (error) {
      console.error('Resume failed:', error);
      onAgentStateChange({
        ...checkpoint.state,
        error: error instanceof Error ? error.message : 'Resume failed',
        partialResults: true,
      });
    } finally {
      onGeneratingChange(false);
      setHasCheckpoint(false);
    }
  };

  const handleDiscardCheckpoint = async () => {
    await checkpointStorage.clear();
    setHasCheckpoint(false);
    // Reset agent state to initial
    onAgentStateChange({
      currentStep: undefined,
      sourceAnalysis: '',
      plan: '',
      todos: [],
      draft: '',
      error: undefined,
      partialResults: false,
    });
  };

  const handleExport = () => {
    const blob = new Blob([agentState.draft || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-draft-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const steps = [
    { id: 'analyzing_sources', labelActive: 'Analyzing', labelCompleted: 'Analyzed', icon: Search },
    { id: 'creating_plan', labelActive: 'Planning', labelCompleted: 'Planned', icon: FileText },
    { id: 'creating_todos', labelActive: 'Creating Tasks', labelCompleted: 'Tasks Created', icon: ListTodo },
    { id: 'executing_draft', labelActive: 'Writing', labelCompleted: 'Written', icon: PenTool },
    { id: 'refining', labelActive: 'Refining', labelCompleted: 'Refined', icon: Wand2 },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['analyzing_sources', 'creating_plan', 'creating_todos', 'executing_draft', 'refining', 'finished'];
    const currentIndex = stepOrder.indexOf(agentState.currentStep || 'analyzing_sources');
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  const getStepLabel = (step: typeof steps[0]) => {
    const status = getStepStatus(step.id);
    if (status === 'completed') return step.labelCompleted;
    return step.labelActive;
  };

  const getCurrentActivityMessage = () => {
    if (!isGenerating) return null;

    switch (agentState.currentStep) {
      case 'analyzing_sources':
        return 'Analyzing source content and extracting key insights...';
      case 'creating_plan':
        return 'Creating content plan and structure...';
      case 'creating_todos':
        return 'Breaking down plan into executable tasks...';
      case 'executing_draft':
        if (agentState.currentTodo) {
          const currentTodo = agentState.todos?.find(t => t.id === agentState.currentTodo);
          return `Writing: ${currentTodo?.description || 'draft section'}`;
        }
        return 'Writing draft...';
      case 'refining':
        return 'Polishing grammar, flow, and overall quality...';
      default:
        return 'Processing...';
    }
  };

  // Check if any content exists to determine if we should show empty state
  const hasContent = agentState.plan || agentState.draft || (agentState.todos && agentState.todos.length > 0);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Resume Banner */}
        {hasCheckpoint && !isGenerating && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Previous generation found
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    You have an unfinished blog generation. Resume to continue where you left off.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResume}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Resume
                </button>
                <button
                  onClick={handleDiscardCheckpoint}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Blog</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sources.length} source{sources.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || sources.length === 0}
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

        {/* Stepper */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 px-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : status === 'current'
                      ? 'bg-primary-600 border-primary-600 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    status === 'completed' || status === 'current'
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {getStepLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Activity Indicator */}
        {isGenerating && getCurrentActivityMessage() && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {getCurrentActivityMessage()}
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
                onClick={handleRetry}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Plan Section - Collapsible Accordion */}
        {agentState.plan && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => setShowPlan(!showPlan)}
              className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold text-sm uppercase tracking-wider">Content Plan</h3>
              </div>
              {showPlan ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
            {showPlan && (
              <div className="px-4 pb-4 prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentState.plan}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Todos Section - Collapsible when all completed */}
        {agentState.todos && agentState.todos.length > 0 && (
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 ${
            allTodosCompleted ? 'border-l-4 border-l-green-500' : ''
          }`}>
            <button
              onClick={() => setShowTodos(!showTodos)}
              className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                allTodosCompleted ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
              }`}
              disabled={!allTodosCompleted}
            >
              <div className={`flex items-center gap-2 ${
                allTodosCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'
              }`}>
                <ListTodo className="w-4 h-4" />
                <h3 className="font-semibold text-sm uppercase tracking-wider">
                  Action Items {allTodosCompleted && `(${agentState.todos.length} Completed)`}
                </h3>
              </div>
              {allTodosCompleted && (
                showTodos ?
                  <ChevronUp className="w-4 h-4 text-gray-500" /> :
                  <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {(!allTodosCompleted || showTodos) && (
              <div className="px-4 pb-4">
                <ul className="space-y-2">
                  {agentState.todos.map((todo: TodoItem) => (
                    <li key={todo.id} className="flex items-start gap-2 text-sm">
                      {todo.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : todo.status === 'in_progress' ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`${
                        todo.status === 'completed' ? 'text-gray-500 dark:text-gray-400 line-through' :
                        todo.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400 font-medium' :
                        'text-gray-700 dark:text-gray-300'
                      }`}>
                        {todo.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Draft Section */}
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

            {/* Action Buttons - Show when generation is complete */}
            {agentState.currentStep === 'finished' && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => navigator.clipboard.writeText(agentState.draft || '')}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                  title="Export as Markdown"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                <button
                  onClick={handleDiscardCheckpoint}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                  title="Clear state and start over"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>New Draft</span>
                </button>
              </div>
            )}

            <div className="prose dark:prose-invert dark:text-[whitesmoke] prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentState.draft}</ReactMarkdown>
            </div>
          </div>
        )}

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
