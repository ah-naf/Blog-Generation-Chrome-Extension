import type { ExtractionResult } from './types';

export abstract class BaseExtractor {
  protected abstract platform: string;

  abstract detect(): boolean;

  extract(): ExtractionResult {
    console.log(`🎯 Starting ${this.platform} extraction...`);

    const title = this.extractTitle();
    const author = this.extractAuthor();
    const content = this.extractContent();

    if (!content) {
      return {
        success: false,
        error: 'Could not extract content from this page',
      };
    }

    const result = {
      platform: this.platform,
      title,
      author,
      content,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
    };

    console.log('\n✅ Extraction Complete!');
    console.log('📦 Extracted Object:', result);

    return {
      success: true,
      content: result,
    };
  }

  protected abstract extractTitle(): string;
  protected abstract extractAuthor(): string;
  protected abstract extractContent(): string;

  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  }

  protected querySelector(selectors: string[]): string {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        return this.cleanText(element.textContent);
      }
    }
    return '';
  }
}
