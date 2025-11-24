// Common types used across the extension

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

export interface StorageData {
  settings?: Settings;
  sources?: SourceContent[];
}
