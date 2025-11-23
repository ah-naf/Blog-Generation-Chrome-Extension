export interface ExtractedContent {
  platform: string;
  title: string;
  author: string;
  content: string;
  url: string;
  extractedAt: string;
  images?: Record<string, string>;
}

export interface ExtractionResult {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
}
