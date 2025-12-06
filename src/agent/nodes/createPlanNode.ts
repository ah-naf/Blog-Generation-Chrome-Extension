import { generateContent } from '@/shared/services/aiService';
import { BlogAgentState } from '../types';
import { withRetry } from '../utils/retry';

export async function createPlanNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { sourceAnalysis, sources } = state;

  const systemPrompt = `You are an expert Medium blog post strategist. Create a detailed content plan optimized for Medium's platform.

**Medium Blog Best Practices:**
- Start with a compelling hook or personal anecdote
- Use clear H2 (##) and H3 (###) headings for structure
- Include code blocks with syntax highlighting (use \`\`\`language syntax)
- Break down complex concepts into step-by-step sections
- Add practical examples and real-world use cases
- Use bullet points and numbered lists for clarity
- Include visual breaks (horizontal rules with ---)
- End with clear takeaways and next steps

**Your Task:**
Provide your response in TWO sections:

## Reasoning
Explain in 2-3 sentences WHY this structure/approach makes sense for Medium readers. Consider:
- What makes this topic engaging?
- Why this step-by-step approach works
- How code examples enhance understanding

## Plan
Create a detailed Medium blog outline with:

1. **Catchy Title** (with a subtitle if needed)
2. **Introduction** (2-3 paragraphs)
   - Hook/personal story
   - Problem statement
   - What readers will learn
3. **Main Content Sections** (3-6 sections)
   - Each section with H2 heading
   - Step-by-step breakdowns where applicable
   - Code examples to include (specify language)
   - Explanations needed
   - Subsections (H3) if complex
4. **Practical Examples/Tutorial**
   - Hands-on implementation
   - Code walkthrough
5. **Common Pitfalls / Best Practices** (if applicable)
6. **Conclusion**
   - Key takeaways (3-5 bullets)
   - Call to action
   - Further resources

Be specific about where code blocks should go and what they should demonstrate.`;

  const userPrompt = `Based on this source analysis:

${sourceAnalysis}

Create a comprehensive Medium blog post plan that synthesizes insights from all ${sources.length} sources.

Requirements:
- Target audience: Developers/technical readers on Medium
- Style: Conversational yet professional
- Length: 8-12 minute read (~2000-3000 words)
- Must include: Code examples, step-by-step tutorials, practical applications
- Format: Markdown with proper code blocks`;

  try {
    const response = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2
    );

    // Extract plan (everything after ## Plan)
    const planMatch = response.match(/## Plan\s+([\s\S]+)/i);
    const plan = planMatch ? planMatch[1].trim() : response;

    return {
      currentStep: 'creating_todos',
      plan: plan,
    };
  } catch (error) {
    return {
      currentStep: 'finished',
      error: `Failed to create plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
      partialResults: true,
      plan: 'Plan generation failed',
    };
  }
}
