import { generateContent } from '../../shared/services/aiService';
import { getPromptsByType } from '../../shared/services/promptService';
import { BlogAgentState } from '../types';
import { withRetry } from '../utils/retry';
import { DEFAULT_PROMPTS } from '../../shared/prompts/defaultPrompts';

export async function refinementNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { draft, plan } = state;

  const prompts = await getPromptsByType('refinement');

  const systemTemplate =
    prompts?.system.templateText ?? DEFAULT_PROMPTS.refinement.system;
  const userTemplate =
    prompts?.user.templateText ?? DEFAULT_PROMPTS.refinement.user;

  const data = { draft, plan };

  const systemPrompt = systemTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  const userPrompt = userTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  try {
    const refinedDraft = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2,
      2000
    );

    return {
      currentStep: 'finished',
      draft: refinedDraft.trim(),
    };
  } catch (error) {
    console.error('Refinement failed:', error);
    return {
      currentStep: 'finished',
      error: `Refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using original draft.`,
      partialResults: true,
    };
  }
}
