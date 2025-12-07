import { SourceContent, ChatMessage } from '@/shared/types';

export interface TodoItem {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  result?: string;
}

export interface EvaluationScore {
  criterion: string;
  score: number; // 0-10
  feedback: string;
  suggestions?: string[];
}

export interface EvaluationResult {
  overallScore: number; // 0-10
  scores: EvaluationScore[];
  passThreshold: boolean; // true if score >= 8
  iteration: number;
  timestamp: string;
}

export interface BlogAgentState {
  sources: SourceContent[];
  currentStep:
    | 'analyzing_sources'
    | 'creating_plan'
    | 'creating_todos'
    | 'executing_draft'
    | 'refining'
    | 'evaluating'
    | 'optimizing'
    | 'finished';
  currentTodo?: string;
  sourceAnalysis: string;
  plan: string;
  todos: TodoItem[];
  draft: string;
  error?: string;
  partialResults?: boolean;
  // Evaluator-Optimizer fields
  evaluation?: EvaluationResult;
  optimizationIteration?: number;
  maxIterations?: number;
  previousDrafts?: string[]; // Store history for comparison
  chatHistory?: ChatMessage[];
}
