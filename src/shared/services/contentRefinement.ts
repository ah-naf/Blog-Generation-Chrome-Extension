// Content Refinement Service
// Uses the generic AI Service to refine and format content into beautiful markdown
import { generateContent } from './aiService';

export interface RefineContentOptions {
  title: string;
  author: string;
  platform: string;
  rawContent: string;
  images?: Record<string, string>;
}

export interface RefineContentResult {
  success: boolean;
  refinedContent?: string;
  error?: string;
}

/**
 * Build the structured prompt for content refinement
 */
function buildRefinementPrompt(options: RefineContentOptions): string {
  const { title, author, platform, rawContent, images } = options;

  return `You are an expert content editor and markdown formatter. Transform the raw content into beautifully formatted, professional markdown.

## Source Information
- **Title**: ${title}
- **Author**: ${author}
- **Platform**: ${platform}
- **Has Images**: ${images && Object.keys(images).length > 0 ? 'Yes' : 'No'}

## CRITICAL RULES - MUST FOLLOW

### 1. Preserve ALL Original Elements
- **NEVER change, remove, or modify existing links** - Keep exact URLs and link text
- **NEVER change image URLs or captions** - Keep ![original caption](original-url) exactly as is
- **NEVER remove any content** - Only add structure and formatting

### 2. Content Organization
Transform the content by:
- Adding clear heading hierarchy (##, ###, ####)
- Breaking long paragraphs into readable chunks (3-5 sentences max)
- Converting plain lists into proper markdown lists
- Adding horizontal rules (---) between major sections for visual separation
- Creating proper spacing between elements (blank lines)

### 3. Visual Enhancement (Add These)
- Use > blockquotes for important notes, tips, or callouts
- Add **bold** for key terms and important concepts (first mention only)
- Add *italics* for emphasis on specific words
- Use \`inline code\` for technical terms, file names, commands
- Use \`\`\`language code blocks for code snippets (add language tag)
- Create tables for comparing information or listing features

### 4. Formatting Standards
- **Paragraphs**: Max 3-5 sentences, blank line between paragraphs
- **Lists**: Use - for unordered, 1. for numbered
- **Headings**: Progressive hierarchy (## → ### → ####)
- **Code**: Always specify language (\`\`\`javascript, \`\`\`python, etc.)
- **Spacing**:
  - One blank line between paragraphs
  - Two blank lines before major sections (##)
  - One blank line after lists and code blocks

### 5. Quality Checks
- Fix obvious typos and grammar errors
- Ensure consistent formatting throughout
- Remove excessive whitespace or repeated content
- Make sure all links are preserved exactly
- Verify all images have captions and working URLs

## Raw Content to Transform

${rawContent}

## Output Instructions
- Return ONLY the refined markdown - no explanations
- DO NOT wrap output in code blocks
- Start directly with the # title
- Make it visually appealing and easy to read
- Remember: PRESERVE all links and images exactly as they are!`;
}

/**
 * Refine content using the configured AI provider
 */
export async function refineContent(
  options: RefineContentOptions
): Promise<RefineContentResult> {
  try {
    // Build the prompt
    const userPrompt = buildRefinementPrompt(options);
    const systemPrompt =
      'You are a helpful AI assistant specialized in formatting markdown content.';

    // Call AI Service
    const refinedContent = await generateContent(systemPrompt, userPrompt);

    if (!refinedContent) {
      return {
        success: false,
        error: 'No content returned from AI',
      };
    }

    return {
      success: true,
      refinedContent: refinedContent.trim(),
    };
  } catch (error) {
    console.error('Error refining content:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to refine content. Please check your AI settings and API keys.',
    };
  }
}
