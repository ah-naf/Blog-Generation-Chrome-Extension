import { BlogAgentState } from '@/agent/blogAgent';

export function getCurrentActivityMessage(agentState: Partial<BlogAgentState>): string | null {
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
    case 'evaluating':
      return `Evaluating content quality (Iteration ${agentState.optimizationIteration || 1})...`;
    case 'optimizing':
      return `Optimizing based on feedback (Iteration ${agentState.optimizationIteration || 1})...`;
    default:
      return 'Processing...';
  }
}

export function exportDraft(draft: string): void {
  const blob = new Blob([draft], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blog-draft-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
