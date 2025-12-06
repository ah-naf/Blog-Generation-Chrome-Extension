// Common types used across the extension
export * from './promptTypes';

export type Platform =
  | 'udemy'
  | 'coursera'
  | 'medium'
  | 'dev.to'
  | 'hashnode'
  | 'generic';

export type ContentType = 'course' | 'video' | 'blog';

export interface SourceContent {
  id: string;
  platform: string;
  title: string;
  author: string;
  content: string;
  url: string;
  extractedAt: string;
  images?: Record<string, string>; // URL -> Base64
  originalContent?: string; // Store original content before refinement
  refinedContent?: string; // Cache refined content to avoid re-processing
  isRefined?: boolean; // Flag to indicate if content has been refined
  refinedAt?: string; // Timestamp of when content was refined
}

export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Message {
  type: string;
  payload?: unknown;
}

export interface Settings {
  theme: 'light' | 'dark';
  initialized: boolean;
}

export type AIProvider = 'gemini' | 'openai' | 'groq';

export interface AISettings {
  provider: AIProvider;
  apiKeys: {
    gemini: string;
    openai: string;
    groq: string;
  };
  models: {
    gemini: string;
    openai: string;
    groq: string;
  };
  baseUrl?: string; // For local/custom OpenAI compatible endpoints
}

export interface GenerationState {
  agentState?: {
    currentStep?:
      | 'analyzing_sources'
      | 'creating_plan'
      | 'creating_todos'
      | 'executing_draft'
      | 'refining'
      | 'evaluating'
      | 'optimizing'
      | 'finished';
    sourceAnalysis?: string;
    plan?: string;
    todos?: Array<{
      id: string;
      description: string;
      status: 'pending' | 'in_progress' | 'completed';
      result?: string;
    }>;
    draft?: string;
    error?: string;
    partialResults?: boolean;
    currentTodo?: string;
    evaluation?: {
      overallScore: number;
      scores: Array<{
        criterion: string;
        score: number;
        feedback: string;
        suggestions?: string[];
      }>;
      passThreshold: boolean;
      iteration: number;
      timestamp: string;
    };
    optimizationIteration?: number;
    maxIterations?: number;
    previousDrafts?: string[];
  };
  timestamp?: string;
}

export interface StorageData {
  settings?: Settings;
  aiSettings?: AISettings;
  sources?: SourceContent[];
  generationState?: GenerationState;
}
