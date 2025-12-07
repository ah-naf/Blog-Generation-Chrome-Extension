import { generateContent } from '@/shared/services/aiService';
import { getPromptsByType } from '@/shared/services/promptService';
import { BlogAgentState, TodoItem } from '../types';
import { withRetry } from '../utils/retry';
import { DEFAULT_PROMPTS } from '@/shared/prompts/defaultPrompts';

export async function createTodosNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { plan } = state;

  const prompts = await getPromptsByType('create_todos');

  const systemTemplate =
    prompts?.system.templateText ?? DEFAULT_PROMPTS.create_todos.system;
  const userTemplate =
    prompts?.user.templateText ?? DEFAULT_PROMPTS.create_todos.user;

  const data = { plan };

  const systemPrompt = systemTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  const userPrompt = userTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  try {
    const response = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2
    );

    let taskDescriptions: string[] = [];

    const jsonMatch = response.match(/\[([\s\S]*?)\]/);
    if (jsonMatch) {
      try {
        taskDescriptions = JSON.parse('[' + jsonMatch[1] + ']');
      } catch {
        throw new Error('Invalid JSON format in response');
      }
    } else {
      throw new Error('No JSON array found in response');
    }

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
    const fallbackTodos: TodoItem[] = [
      {
        id: 'todo-1',
        description:
          'Write compelling introduction with hook and problem statement',
        status: 'pending',
      },
      {
        id: 'todo-2',
        description: 'Write first main section with explanations',
        status: 'pending',
      },
      {
        id: 'todo-3',
        description:
          'Add code examples with detailed explanations for first section',
        status: 'pending',
      },
      {
        id: 'todo-4',
        description: 'Write second main section with step-by-step tutorial',
        status: 'pending',
      },
      {
        id: 'todo-5',
        description: 'Include practical code examples and walkthrough',
        status: 'pending',
      },
      {
        id: 'todo-6',
        description: 'Write third main section with implementation details',
        status: 'pending',
      },
      {
        id: 'todo-7',
        description:
          'Add best practices and common pitfalls with code snippets',
        status: 'pending',
      },
      {
        id: 'todo-8',
        description: 'Write conclusion with key takeaways and call to action',
        status: 'pending',
      },
    ];

    return {
      currentStep: 'executing_draft',
      todos: fallbackTodos,
      partialResults: true,
      error: `Failed to create detailed tasks: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback tasks.`,
    };
  }
}
