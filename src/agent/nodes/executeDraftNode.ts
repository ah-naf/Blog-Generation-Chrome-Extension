import { generateContent } from '@/shared/services/aiService';
import { BlogAgentState } from '../types';
import { withRetry } from '../utils/retry';

export async function* executeDraftNode(
  state: BlogAgentState
): AsyncGenerator<Partial<BlogAgentState>> {
  const { todos, plan, sourceAnalysis } = state;
  let draftContent = '';
  let updatedTodos = [...todos];

  for (let i = 0; i < todos.length; i++) {
    const todo = todos[i];

    // Mark as in progress
    updatedTodos = updatedTodos.map(t =>
      t.id === todo.id ? { ...t, status: 'in_progress' as const } : t
    );

    yield {
      currentStep: 'executing_draft',
      currentTodo: todo.id,
      todos: updatedTodos,
    };

    const systemPrompt = `You are an expert Medium blog writer. Write a specific section of a technical blog post.

**Task:** ${todo.description}

**Medium Writing Guidelines:**

1. **Formatting:**
   - Use H2 (##) for main section headings
   - Use H3 (###) for subsections
   - Use bold (**text**) for emphasis
   - Use bullet points (-) or numbered lists (1. 2. 3.) for clarity
   - Add horizontal rules (---) between major sections for visual breaks

2. **Code Blocks:**
   - ALWAYS use proper code blocks with language specification
   - Format: \`\`\`javascript (or python, bash, etc.)
   - Include comments in code to explain key parts
   - Show both code AND explanation
   - For multi-step tutorials, break code into smaller blocks with explanations in between

3. **Writing Style:**
   - Conversational but professional tone
   - Start sections with context/why this matters
   - Explain concepts before showing code
   - Use real-world examples and analogies
   - Add practical tips and insights
   - If writing introduction: start with a hook (question, story, or relatable problem)
   - If writing conclusion: summarize key points as bullets and include call to action

4. **Step-by-Step Tutorials:**
   - Number the steps clearly (Step 1, Step 2, etc.)
   - Explain what each step does BEFORE showing code
   - Show the code for that step
   - Explain the output or result
   - Add notes about common mistakes or tips

5. **Code Examples:**
   - Include inline code for short snippets: \`variableName\`
   - Use code blocks for multi-line code
   - Always specify the language: \`\`\`javascript, \`\`\`python, \`\`\`bash, etc.
   - Add comments in code to explain complex parts
   - Show complete, runnable examples when possible

6. **Length:**
   - Write 300-500 words for this section (adjust based on complexity)
   - Don't be too brief - Medium readers expect detailed, thorough content
   - Include enough context and explanation

**IMPORTANT:**
- Write ONLY this section - don't repeat what's already written
- Include code examples if the task mentions them
- Maintain consistent tone with rest of the article
- Use proper markdown formatting
- Make it engaging and educational`;

    const userPrompt = `Content Plan:
${plan}

Source Insights:
${sourceAnalysis}

Current Draft So Far:
${draftContent || '[Start of blog - this is the first section]'}

---

Now write this section: **${todo.description}**

Requirements:
- Follow Medium's style and formatting
- Include code blocks where appropriate (with language tags!)
- Explain code thoroughly
- Make it step-by-step if the task involves a tutorial/process
- Use H2/H3 headings for structure
- Write 300-500 words (more if complex tutorial)

Write the complete section now.`;

    try {
      const sectionContent = await withRetry(
        () => generateContent(systemPrompt, userPrompt),
        2,
        1500
      );

      // Append to draft
      draftContent += (draftContent ? '\n\n' : '') + sectionContent;

      // Mark as completed
      updatedTodos = updatedTodos.map(t =>
        t.id === todo.id
          ? { ...t, status: 'completed' as const, result: sectionContent }
          : t
      );

      yield {
        currentStep: 'executing_draft',
        currentTodo: todo.id,
        todos: updatedTodos,
        draft: draftContent.trim(),
      };

    } catch (error) {
      // Mark as pending (failed), continue with next
      updatedTodos = updatedTodos.map(t =>
        t.id === todo.id ? { ...t, status: 'pending' as const } : t
      );

      yield {
        currentStep: 'executing_draft',
        todos: updatedTodos,
        draft: draftContent.trim(),
        partialResults: true,
        error: `Task "${todo.description}" failed: ${error instanceof Error ? error.message : 'Unknown error'}. Continuing with next task.`,
      };
    }
  }

  // Final state
  yield {
    currentStep: 'finished',
    todos: updatedTodos,
    draft: draftContent.trim(),
  };
}
