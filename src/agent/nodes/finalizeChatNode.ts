import { generateContent } from '../../shared/services/aiService';
import { getPromptsByType } from '../../shared/services/promptService';
import { BlogAgentState } from '../types';
import { withRetry } from '../utils/retry';
import { DEFAULT_PROMPTS } from '../../shared/prompts/defaultPrompts';

interface FinalizeChatInputs {
  previousDraft: string;
  refinedDraft: string;
}

export async function finalizeChatNode(
  _state: BlogAgentState,
  inputs: FinalizeChatInputs
): Promise<Partial<BlogAgentState>> {
  const prompts = await getPromptsByType('chat_final_refinement');

  const systemTemplate =
    prompts?.system.templateText ??
    DEFAULT_PROMPTS.chat_final_refinement.system;
  const userTemplate =
    prompts?.user.templateText ?? DEFAULT_PROMPTS.chat_final_refinement.user;

  const data = {
    previousDraft: inputs.previousDraft,
    refinedDraft: inputs.refinedDraft,
  };

  const systemPrompt = systemTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  const userPrompt = userTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  try {
    const finalDraft = await withRetry(
      () => generateContent(systemPrompt, userPrompt),
      2,
      2000
    );

    return {
      currentStep: 'finished',
      draft: finalDraft.trim(),
    };
  } catch (error) {
    console.error('Finalization failed:', error);
    return {
      currentStep: 'finished',
      error: `Finalization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using chat draft as is.`,
      draft: inputs.refinedDraft, // Fallback to refined draft
      partialResults: true,
    };
  }
}
