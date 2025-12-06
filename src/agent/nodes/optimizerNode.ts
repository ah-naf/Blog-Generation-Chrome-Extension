import { BlogAgentState } from '../types';
import { generateContent } from '@/shared/services/aiService';
import { withRetry } from '@/shared/utils/retry';

/**
 * Optimizes the blog draft based on evaluation feedback
 */
export async function optimizerNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { draft, plan, evaluation, previousDrafts = [] } = state;

  if (!evaluation || evaluation.passThreshold) {
    // No optimization needed
    return {
      currentStep: 'finished',
    };
  }

  // Store current draft in history
  const updatedHistory = [...previousDrafts, draft];

  // Build detailed feedback for optimization
  const feedbackSummary = evaluation.scores
    .filter((s) => s.score < 8)
    .map(
      (s) =>
        `**${s.criterion}** (Score: ${s.score}/10)
- Feedback: ${s.feedback}
${s.suggestions && s.suggestions.length > 0 ? `- Suggestions:\n${s.suggestions.map((sg) => `  * ${sg}`).join('\n')}` : ''}`
    )
    .join('\n\n');

  const systemPrompt = `You are an expert technical blog writer specializing in optimization and refinement. Your task is to improve a blog draft based on detailed evaluation feedback.

**Optimization Guidelines:**

1. **Preserve Strengths**: Keep aspects that scored well (8+/10)
2. **Target Weaknesses**: Focus on criteria that scored below 8/10
3. **Incremental Improvement**: Make focused improvements, don't rewrite everything
4. **Maintain Structure**: Keep the overall structure and flow unless feedback specifically mentions it
5. **Technical Accuracy**: Never sacrifice correctness for style
6. **Code Quality**: Ensure all code examples are complete, correct, and well-explained
7. **Medium Style**: Maintain professional technical blog tone with:
   - Clear headings and sections
   - Code blocks with syntax highlighting
   - Engaging introduction and conclusion
   - Practical examples and use cases

**Current Evaluation Scores:**
- Overall Score: ${evaluation.overallScore}/10
- Iteration: ${evaluation.iteration}

**Areas Needing Improvement (Score < 8):**
${feedbackSummary}

**Your Task:**
Rewrite the blog post addressing the specific feedback above. Return the complete optimized blog post in Markdown format.`;

  const userPrompt = `**Original Plan:**
${plan}

**Current Draft:**
${draft}

**Optimization Instructions:**
Improve this draft by addressing the evaluation feedback. Focus on:
${evaluation.scores.filter((s) => s.score < 8).map((s) => `- ${s.criterion}: ${s.suggestions?.[0] || s.feedback}`).join('\n')}

Return the complete optimized blog post.`;

  try {
    const optimizedDraft = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2,
      2000
    );

    return {
      currentStep: 'optimizing',
      draft: optimizedDraft.trim(),
      previousDrafts: updatedHistory,
    };
  } catch (error) {
    console.error('Optimization failed:', error);
    throw error;
  }
}
