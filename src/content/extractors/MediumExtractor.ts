import { BaseExtractor } from './BaseExtractor';

export class MediumExtractor extends BaseExtractor {
  protected platform = 'medium';

  detect(): boolean {
    return window.location.href.includes('medium.com');
  }

  protected extractTitle(): string {
    // console.log('📝 Extracting title...');

    const title = this.querySelector([
      'h1',
      'article h1',
      '[data-testid="storyTitle"]',
      '.pw-post-title',
    ]);

    if (title) {
      // console.log(`✅ Title: ${title}`);
      return title;
    }

    // console.log('⚠️ Using document.title');
    return document.title;
  }

  protected extractAuthor(): string {
    // console.log('👤 Extracting author...');

    const author = this.querySelector([
      '[data-testid="authorName"]',
      'a[rel="author"]',
      '.pw-author-name',
      'article a[href*="@"]',
    ]);

    if (author) {
      // console.log(`✅ Author: ${author}`);
      return author;
    }

    // console.log('⚠️ Author not found');
    return 'Unknown';
  }

  protected extractContent(): string {
    const article = document.querySelector('article');
    console.log('🔍 Looking for article tag...');
    console.log('Article element:', article);

    if (!article) {
      console.error('❌ No <article> tag found');
      return '';
    }

    console.log('✅ Found article tag');
    console.log('Article children count:', article.children.length);

    const parts: string[] = [];
    const title = this.extractTitle();
    const author = this.extractAuthor();

    // Query all content elements within article, not just direct children
    const elements = article.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, pre, blockquote, figure');
    console.log('Processing', elements.length, 'content elements');

    for (const element of Array.from(elements)) {
      const tagName = element.tagName.toLowerCase();

      if (tagName === 'figure') {
        const img = element.querySelector('img');
        if (img && this.isContentImage(img)) {
          const alt = img.alt || 'Image';
          const src = img.src || img.getAttribute('data-src') || '';
          if (src) {
            parts.push(`\n![${alt}](${src})\n`);
          }
          const figcaption = element.querySelector('figcaption');
          if (figcaption?.textContent) {
            parts.push(`*${this.cleanText(figcaption.textContent)}*\n`);
          }
        }
        continue;
      }

      const text = element.textContent?.trim();
      if (!text || text.length < 3) continue;
      if (text === title || text === author) continue;

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
      }
    }

    console.log('📝 Extracted', parts.length, 'content parts');
    const result = parts.join('\n');
    console.log('📊 Final content length:', result.length);
    return result;
  }

  protected extractImages(): string[] {
    const article = document.querySelector('article');
    if (!article) return [];

    const figures = article.querySelectorAll('figure');
    const images: string[] = [];

    for (const figure of Array.from(figures)) {
      const img = figure.querySelector('img');
      if (!img || !this.isContentImage(img)) continue;

      const src = img.src || img.getAttribute('data-src');
      if (src) {
        images.push(src);
      }
    }

    return images;
  }

  private isContentImage(img: HTMLImageElement): boolean {
    const src = img.src || '';
    const alt = img.alt || '';
    const parent = img.closest('figure');

    if (!parent) return false;
    if (src.includes('avatar')) return false;
    if (src.includes('badge')) return false;
    if (src.includes('icon')) return false;
    if (alt.toLowerCase().includes('avatar')) return false;
    if (alt.toLowerCase().includes('profile')) return false;
    if (img.width < 100 && img.height < 100) return false;

    return true;
  }
}
