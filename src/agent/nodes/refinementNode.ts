import { generateContent } from '@/shared/services/aiService';
import { BlogAgentState } from '../types';
import { withRetry } from '../utils/retry';

export async function refinementNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { draft, plan } = state;

  const systemPrompt = `You are an expert Medium blog editor specializing in technical content. Your task is to refine and polish a blog post draft to ensure it meets the highest quality standards.

**Your Refinement Focus:**

1. **Grammar & Spelling:**
   - Fix all grammatical errors
   - Correct spelling mistakes
   - Ensure proper punctuation
   - Fix awkward phrasing

2. **Tone & Consistency:**
   - Maintain a conversational yet professional tone throughout
   - Ensure consistent voice (avoid switching between formal/informal)
   - Keep technical accuracy while remaining accessible
   - Ensure consistent terminology (don't switch between "function" and "method" randomly)

3. **Structure & Flow:**
   - Smooth transitions between sections
   - Logical progression of ideas
   - Proper paragraph breaks (not too long, not too short)
   - Clear section boundaries

4. **Code Quality:**
   - Ensure all code blocks have proper language tags (\`\`\`javascript, \`\`\`python, etc.)
   - Add helpful comments to complex code
   - Check code formatting and indentation
   - Verify code examples are complete and runnable
   - Ensure inline code uses backticks properly

5. **Readability:**
   - Break up long paragraphs (max 4-5 lines)
   - Use bullet points for lists
   - Add emphasis (**bold**) for key concepts
   - Remove redundant phrases
   - Simplify overly complex sentences
   - Ensure headings are clear and descriptive

6. **Medium-Specific:**
   - Ensure H2 (##) and H3 (###) headings are used correctly
   - Verify horizontal rules (---) are used for visual breaks
   - Check that code blocks stand out
   - Ensure the introduction hooks the reader
   - Verify the conclusion has clear takeaways

**What NOT to Change:**
- Don't alter the core message or key points
- Don't remove technical accuracy for simplicity
- Don't change code logic (only formatting/comments)
- Don't add new sections not in the original plan
- Don't change the overall structure drastically

**Output Format:**
Return ONLY the refined markdown content. Do not add any preamble like "Here's the refined version" or explanations. Just return the polished blog post.`;

  const userPrompt = `Refine this Medium blog post draft:

---

${draft}

---

Original Plan (for context):
${plan}

---

Polish this draft while maintaining its core message and structure. Focus on grammar, flow, readability, and Medium best practices. Return only the refined markdown content.`;

  try {
    const refinedDraft = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2,
      2000 // Slightly longer delay for refinement
    );

    return {
      currentStep: 'finished',
      draft: refinedDraft.trim(),
    };
  } catch (error) {
    // If refinement fails, keep the original draft
    console.error('Refinement failed:', error);
    return {
      currentStep: 'finished',
      error: `Refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using original draft.`,
      partialResults: true,
    };
  }
}
