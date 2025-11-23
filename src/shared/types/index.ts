// Common types used across the extension

export type Platform =
  | 'youtube'
  | 'udemy'
  | 'coursera'
  | 'medium'
  | 'dev.to'
  | 'hashnode'
  | 'generic';

export type ContentType = 'course' | 'video' | 'blog';

export interface ExtractedContent {
  id: string;
  type: ContentType;
  platform: Platform;
  title: string;
  url: string;
  content: Section[];
  metadata: Record<string, unknown>;
  extractedAt: string;
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
  extractedContent?: ExtractedContent[];
}
