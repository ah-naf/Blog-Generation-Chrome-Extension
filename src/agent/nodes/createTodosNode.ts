import { generateContent } from '@/shared/services/aiService';
import { BlogAgentState, TodoItem } from '../types';
import { withRetry } from '../utils/retry';

export async function createTodosNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { plan } = state;

  const systemPrompt = `You are breaking down a Medium blog plan into executable writing tasks.

**Important Guidelines:**
- Create tasks that build the blog step-by-step
- Each task should produce a complete section with proper formatting
- Tasks should include writing code blocks where specified in the plan
- Order tasks logically (intro → main sections → conclusion)
- Make tasks specific about what code/examples to include

Provide response in TWO sections:

## Reasoning
Explain in 2-3 sentences your task breakdown strategy for this Medium blog post.

## Tasks
Return ONLY a JSON array of task descriptions (6-10 tasks):
["Task 1", "Task 2", "Task 3"]

**Task Format Examples:**
- "Write engaging introduction with hook and problem statement"
- "Write Section 1: Setup and Installation with code examples"
- "Create step-by-step tutorial for [topic] with code walkthrough"
- "Write code example demonstrating [concept] with explanation"
- "Write Common Pitfalls section with code snippets"
- "Write conclusion with key takeaways and call to action"

Each task should be:
- Specific and actionable (starts with a verb)
- Clear about what content/code to include
- Focused on writing one section/element
- Ordered logically`;

  const userPrompt = `Break down this Medium blog plan into executable writing tasks:

${plan}

Provide reasoning then JSON array of 6-10 specific tasks.

Remember: Tasks should specify when code blocks are needed!`;

  try {
    const response = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2
    );

    // Extract JSON array - handle various formats
    let taskDescriptions: string[] = [];

    // Try to find JSON array in response
    const jsonMatch = response.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      try {
        taskDescriptions = JSON.parse('[' + jsonMatch[1] + ']');
      } catch (parseError) {
        console.error('Failed to parse JSON array:', parseError);
        throw new Error('Invalid JSON format in response');
      }
    } else {
      throw new Error('No JSON array found in response');
    }

    // Ensure we have valid tasks
    if (!Array.isArray(taskDescriptions) || taskDescriptions.length === 0) {
      throw new Error('No tasks generated');
    }

    const todos: TodoItem[] = taskDescriptions.map((desc, idx) => ({
      id: `todo-${idx + 1}`,
      description: desc,
      status: 'pending' as const,
    }));

    return {
      currentStep: 'executing_draft',
      todos: todos,
    };
  } catch (error) {
    // Fallback: create generic Medium blog tasks
    const fallbackTodos: TodoItem[] = [
      { id: 'todo-1', description: 'Write compelling introduction with hook and problem statement', status: 'pending' },
      { id: 'todo-2', description: 'Write first main section with explanations', status: 'pending' },
      { id: 'todo-3', description: 'Add code examples with detailed explanations for first section', status: 'pending' },
      { id: 'todo-4', description: 'Write second main section with step-by-step tutorial', status: 'pending' },
      { id: 'todo-5', description: 'Include practical code examples and walkthrough', status: 'pending' },
      { id: 'todo-6', description: 'Write third main section with implementation details', status: 'pending' },
      { id: 'todo-7', description: 'Add best practices and common pitfalls with code snippets', status: 'pending' },
      { id: 'todo-8', description: 'Write conclusion with key takeaways and call to action', status: 'pending' },
    ];

    return {
      currentStep: 'executing_draft',
      todos: fallbackTodos,
      partialResults: true,
      error: `Failed to create detailed tasks: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback tasks.`,
    };
  }
}
