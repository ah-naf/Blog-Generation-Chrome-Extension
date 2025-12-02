import { SourceContent } from '@/shared/types';

export interface TodoItem {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  result?: string;
}

export interface BlogAgentState {
  sources: SourceContent[];
  currentStep: 'analyzing_sources' | 'creating_plan' | 'creating_todos' | 'executing_draft' | 'refining' | 'finished';
  currentTodo?: string;
  sourceAnalysis: string;
  plan: string;
  todos: TodoItem[];
  draft: string;
  error?: string;
  partialResults?: boolean;
}

export interface AgentCheckpoint {
  id: string;
  state: BlogAgentState;
  timestamp: number;
  lastUpdated: number;
}
