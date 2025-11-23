import type { ExtractionResult } from './types';

export abstract class BaseExtractor {
  protected abstract platform: string;

  abstract detect(): boolean;

  async extract(): Promise<ExtractionResult> {
    // console.log(`🎯 Starting ${this.platform} extraction...`);

    const title = this.extractTitle();
    // console.log('📝 Title:', title);

    const author = this.extractAuthor();
    // console.log('👤 Author:', author);

    const content = this.extractContent();
    // console.log('📄 Content length:', content.length);

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

    // console.log('\n✅ Extraction Complete!');
    // console.log('📦 Extracted Object:', result);
    // if (images && Object.keys(images).length > 0) {
    //   console.log(`🖼️ Images extracted: ${Object.keys(images).length}`);
    // }

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
