import { SourceContent } from '@/shared/types';

export function extractKeyContent(source: SourceContent): string {
  const content = source.content;
  const maxLength = 2000;

  if (content.length <= maxLength) return content;

  // Try to extract by markdown headings
  const headingPattern = /^#{1,3}\s+.+$/gm;
  const headings = content.match(headingPattern);

  if (headings && headings.length > 0) {
    // Extract introduction + key sections
    const sections: string[] = [];
    const lines = content.split('\n');
    let currentSection = '';
    let sectionCount = 0;

    for (const line of lines) {
      if (headingPattern.test(line)) {
        if (currentSection.length > 0) {
          sections.push(currentSection);
          currentSection = '';
          sectionCount++;
        }
        if (sectionCount >= 5) break; // Limit to 5 sections
      }
      currentSection += line + '\n';
      if (currentSection.length > maxLength) break;
    }

    if (currentSection.length > 0) sections.push(currentSection);
    return sections.join('\n---\n').slice(0, maxLength);
  }

  // Fallback: extract by paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  let extracted = '';

  for (const para of paragraphs.slice(0, 10)) {
    if ((extracted + para).length > maxLength) break;
    extracted += para + '\n\n';
  }

  return extracted || content.slice(0, maxLength);
}
