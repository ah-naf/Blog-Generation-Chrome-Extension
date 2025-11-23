import { BaseExtractor } from './BaseExtractor';

export class GenericExtractor extends BaseExtractor {
  protected platform = 'generic';

  detect(): boolean {
    return true;
  }

  protected extractTitle(): string {
    return document.title || 'Untitled';
  }

  protected extractAuthor(): string {
    const author = this.querySelector([
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline',
    ]);

    return author || '';
  }

  protected extractContent(): string {
    const mainContent = this.findMainContent();
    if (!mainContent) {
      return '';
    }

    const contentElements = mainContent.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, ul, ol, pre, blockquote, div'
    );

    const parts: string[] = [];
    const title = this.extractTitle();

    contentElements.forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent?.trim();

      if (!text || text.length < 3) return;
      if (text === title) return;

      if (this.shouldSkipElement(element)) return;

      if (tagName.match(/^h[1-6]$/)) {
        parts.push(`\n## ${this.cleanText(text)}\n`);
      } else if (tagName === 'pre') {
        const code = element.querySelector('code');
        const codeText = code ? code.textContent : text;
        parts.push(`\n\`\`\`\n${codeText}\n\`\`\`\n`);
      } else if (tagName === 'blockquote') {
        parts.push(`\n> ${this.cleanText(text)}\n`);
      } else if (tagName === 'ul' || tagName === 'ol') {
        const items = Array.from(element.querySelectorAll('li'));
        const listItems = items
          .map((li, idx) => {
            const itemText = this.cleanText(li.textContent || '');
            return tagName === 'ul' ? `- ${itemText}` : `${idx + 1}. ${itemText}`;
          })
          .join('\n');
        parts.push(`\n${listItems}\n`);
      } else if (tagName === 'p') {
        parts.push(this.cleanText(text) + '\n');
      } else if (tagName === 'div') {
        const hasBlockChildren = Array.from(element.children).some((child) =>
          ['P', 'UL', 'OL', 'PRE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(
            child.tagName
          )
        );
        if (!hasBlockChildren && text.length > 20) {
          parts.push(this.cleanText(text) + '\n');
        }
      }
    });

    return parts.join('\n');
  }

  private findMainContent(): HTMLElement | null {
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.article-content',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && this.hasSubstantialContent(element)) {
        return element as HTMLElement;
      }
    }

    return document.body;
  }

  private hasSubstantialContent(element: Element): boolean {
    const text = element.textContent?.trim() || '';
    return text.length > 100;
  }

  private shouldSkipElement(element: Element): boolean {
    const skipClasses = ['nav', 'header', 'footer', 'sidebar', 'menu', 'ad', 'comment'];
    const className = element.className.toLowerCase();
    return skipClasses.some((skip) => className.includes(skip));
  }
}
