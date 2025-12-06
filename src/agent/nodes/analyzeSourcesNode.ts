import { generateContent } from '@/shared/services/aiService';
import { BlogAgentState } from '../types';
import { extractKeyContent } from '../utils/sourceExtraction';
import { withRetry } from '../utils/retry';

export async function analyzeSourcesNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { sources } = state;

  try {
    // Analyze each source individually
    const sourceAnalyses: string[] = [];

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      const keyContent = extractKeyContent(source);

      const systemPrompt = `You are a content analyst for Medium blog posts. Analyze this source and extract:
1. Main topic/theme
2. Key technical concepts or code examples mentioned
3. Step-by-step processes or tutorials described
4. Practical insights and real-world applications
5. Code snippets, commands, or technical details (if any)
6. Notable quotes, statistics, or data points

Focus on identifying content that can be transformed into a practical, tutorial-style Medium blog post.
Be concise - aim for 150-250 words.`;

      const userPrompt = `Source: ${source.title}
Platform: ${source.platform}
Author: ${source.author}

Content:
${keyContent}

Provide your analysis with special attention to:
- Technical concepts that need explanation
- Code examples or implementation details
- Step-by-step processes
- Practical applications`;

      try {
        const analysis = await withRetry(
          () => generateContent(systemPrompt, userPrompt),
          2
        );

        sourceAnalyses.push(`### Source ${i + 1}: ${source.title}\n**URL:** ${source.url}\n\n${analysis}`);
      } catch (error) {
        // If a single source fails, continue with others
        sourceAnalyses.push(`### Source ${i + 1}: ${source.title}\n*Analysis failed for this source*`);
        console.error(`Failed to analyze source ${i + 1}:`, error);
      }
    }

    // Synthesize across all sources for Medium-style blog
    const synthesisPrompt = `You are synthesizing insights from ${sources.length} sources to create a Medium blog post outline.

Identify:
1. **Main Theme**: What overarching topic connects these sources?
2. **Technical Depth**: What level of technical detail is appropriate?
3. **Tutorial Potential**: What step-by-step tutorials can be created?
4. **Code Examples**: What code snippets or examples should be included?
5. **Story Arc**: How to structure this as an engaging Medium article with a clear beginning, middle, and end?
6. **Target Audience**: Who would benefit most from this content?

For Medium, focus on:
- Clear, conversational writing style
- Practical, actionable content
- Code examples with explanations
- Real-world use cases
- Step-by-step tutorials where applicable

Be comprehensive but concise (250-350 words).`;

    const synthesisInput = `Here are the individual source analyses:

${sourceAnalyses.join('\n\n---\n\n')}

Synthesize these insights into a cohesive overview for a Medium blog post.`;

    const synthesis = await withRetry(
      () => generateContent(synthesisPrompt, synthesisInput),
      2
    );

    const finalAnalysis = `${sourceAnalyses.join('\n\n---\n\n')}\n\n## Cross-Source Synthesis for Medium Blog\n\n${synthesis}`;

    return {
      currentStep: 'creating_plan',
      sourceAnalysis: finalAnalysis,
    };
  } catch (error) {
    return {
      currentStep: 'finished',
      error: `Failed to analyze sources: ${error instanceof Error ? error.message : 'Unknown error'}`,
      partialResults: false,
    };
  }
}
