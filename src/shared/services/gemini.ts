// Gemini AI Service for content refinement

const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';
// Using Gemini 2.0 Flash (experimental) - latest and fastest model
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
 * Get the stored Gemini API key
 */
export async function getGeminiApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(GEMINI_API_KEY_STORAGE_KEY);
  return result[GEMINI_API_KEY_STORAGE_KEY] || null;
}

/**
 * Set the Gemini API key
 */
export async function setGeminiApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ [GEMINI_API_KEY_STORAGE_KEY]: apiKey });
}

/**
 * Clear the stored Gemini API key
 */
export async function clearGeminiApiKey(): Promise<void> {
  await chrome.storage.local.remove(GEMINI_API_KEY_STORAGE_KEY);
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
 * Refine content using Gemini AI
 */
export async function refineContent(
  options: RefineContentOptions
): Promise<RefineContentResult> {
  try {
    // Get API key
    const apiKey = await getGeminiApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please add your API key in settings.',
      };
    }

    // Build the prompt
    const prompt = buildRefinementPrompt(options);

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);

      if (response.status === 403) {
        return {
          success: false,
          error: 'Invalid API key. Please check your Gemini API key in settings.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again in a few moments.',
        };
      }

      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    // Extract the refined content
    const refinedContent =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!refinedContent) {
      return {
        success: false,
        error: 'No content returned from API',
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
          : 'Failed to refine content. Please try again.',
    };
  }
}
