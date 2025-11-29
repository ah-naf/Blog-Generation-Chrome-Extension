import type { ExtractionResult } from './types';

/**
 * Base class for all content extractors.
 * Provides common functionality for extracting title, author, content, and images.
 */
export abstract class BaseExtractor {
  protected abstract platform: string;

  /**
   * Detects if the current page is supported by this extractor.
   */
  abstract detect(): boolean;

  /**
   * Main extraction method.
   * Orchestrates the extraction of title, author, content, and images.
   */
  async extract(): Promise<ExtractionResult> {
    const title = this.extractTitle();
    const author = this.extractAuthor();
    const content = this.extractContent();

    if (!content) {
      console.error('❌ No content extracted');
      return {
        success: false,
        error: 'Could not extract content from this page',
      };
    }

    const images = await this.extractImages();

    const result = {
      platform: this.platform,
      title,
      author,
      content,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      images: Object.keys(images).length > 0 ? images : undefined,
    };

    // console.log('📦 Extracted Object:', result);

    return {
      success: true,
      content: result,
    };
  }

  protected abstract extractTitle(): string;
  protected abstract extractAuthor(): string;
  protected abstract extractContent(): string;

  /**
   * Cleans text by removing extra whitespace and normalizing newlines.
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Helper to query a selector from a list of potential selectors.
   * Returns the text content of the first match.
   */
  protected querySelector(selectors: string[]): string {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return this.cleanText(element.textContent);
      }
    }
    return '';
  }

  protected async extractImages(): Promise<Record<string, string>> {
    return {};
  }

  protected async fetchImageAsBase64(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await this.blobToBase64(blob);
    } catch (error) {
      console.error(`Failed to fetch image: ${url}`, error);
      return null;
    }
  }

  protected blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
