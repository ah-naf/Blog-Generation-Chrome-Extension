export interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'array' | 'object';
  default?: string;
  required: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  templateText: string;
  role: 'system' | 'user';
  version: number;
  tags: string[];
  variables: PromptVariable[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface PromptTemplatePair {
  system: PromptTemplate;
  user: PromptTemplate;
}

export type PromptTemplateType =
  | 'analyze_sources'
  | 'create_plan'
  | 'create_todos'
  | 'execute_draft'
  | 'refinement'
  | 'evaluation'
  | 'optimization'
  | 'chat_final_refinement';

export interface PromptVersionEntry {
  version: number;
  templateText: string;
  updatedAt: string;
  changedBy?: string;
}

export interface PromptVersionHistory {
  templateId: string;
  versions: PromptVersionEntry[];
}
