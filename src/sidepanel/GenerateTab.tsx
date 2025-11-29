import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, CheckCircle2, Loader2, Search, FileText, ListTodo, PenTool, Circle } from 'lucide-react';
import { blogAgent, BlogAgentState, TodoItem } from '@/agent/blogAgent';
import { SourceContent } from '@/shared/types';

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
  const handleGenerate = async () => {
    if (sources.length === 0) return;

    onGeneratingChange(true);
    onAgentStateChange({
      currentStep: 'analyzing_sources',
      sourceAnalysis: '',
      plan: '',
      todos: [],
      draft: '',
    });

    try {
      const inputs = { sources } as any;
      const stream = await blogAgent.stream(inputs);

      for await (const chunk of stream) {
        // The chunk contains the update from the last node
        const nodeName = Object.keys(chunk)[0];
        const update = (chunk as any)[nodeName] as Partial<BlogAgentState>;

        onAgentStateChange({
          ...agentState,
          ...update,
        });
      }

      onAgentStateChange({ ...agentState, currentStep: 'finished' });
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

  const steps = [
    { id: 'analyzing_sources', label: 'Analyzing', icon: Search },
    { id: 'creating_plan', label: 'Planning', icon: FileText },
    { id: 'creating_todos', label: 'Tasks', icon: ListTodo },
    { id: 'executing_draft', label: 'Writing', icon: PenTool },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['analyzing_sources', 'creating_plan', 'creating_todos', 'executing_draft', 'finished'];
    const currentIndex = stepOrder.indexOf(agentState.currentStep || 'analyzing_sources');
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
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
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
                  {step.label}
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

        {/* Plan Section */}
        {agentState.plan && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3 text-primary-600 dark:text-primary-400">
              <FileText className="w-4 h-4" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Content Plan</h3>
            </div>
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentState.plan}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Todos Section */}
        {agentState.todos && agentState.todos.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="flex items-center gap-2 mb-3 text-primary-600 dark:text-primary-400">
              <ListTodo className="w-4 h-4" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Action Items</h3>
            </div>
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

        {/* Draft Section */}
        {agentState.draft && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex items-center gap-2 mb-4 text-primary-600 dark:text-primary-400">
              <PenTool className="w-4 h-4" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Generated Draft</h3>
            </div>
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentState.draft}</ReactMarkdown>
            </div>
          </div>
        )}

        {!agentState.plan && !isGenerating && sources.length > 0 && (
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
