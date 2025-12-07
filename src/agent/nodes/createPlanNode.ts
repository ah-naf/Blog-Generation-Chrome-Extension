import { generateContent } from '@/shared/services/aiService';
import { getPromptsByType } from '@/shared/services/promptService';
import { BlogAgentState } from '../types';
import { withRetry } from '../utils/retry';
import { DEFAULT_PROMPTS } from '@/shared/prompts/defaultPrompts';

export async function createPlanNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { sourceAnalysis, sources } = state;

  const prompts = await getPromptsByType('create_plan');

  const systemTemplate =
    prompts?.system.templateText ?? DEFAULT_PROMPTS.create_plan.system;
  const userTemplate =
    prompts?.user.templateText ?? DEFAULT_PROMPTS.create_plan.user;

  const data = {
    sourceAnalysis,
    sourceCount: sources.length.toString(),
  };

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
