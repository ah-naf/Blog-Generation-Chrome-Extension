import { BlogAgentState } from '../types';
import { generateContent } from '../../shared/services/aiService';
import { getPromptsByType } from '../../shared/services/promptService';
import { withRetry } from '../utils/retry';
import { DEFAULT_PROMPTS } from '../../shared/prompts/defaultPrompts';

export async function optimizerNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { draft, plan, evaluation, previousDrafts = [] } = state;

  if (!evaluation || evaluation.passThreshold) {
    return { currentStep: 'finished' };
  }

  const updatedHistory = [...previousDrafts, draft];

  const feedbackSummary = evaluation.scores
    .filter((s) => s.score < 8)
    .map(
      (s) =>
        `**${s.criterion}** (Score: ${s.score}/10)
- Feedback: ${s.feedback}
${s.suggestions && s.suggestions.length > 0 ? `- Suggestions:\n${s.suggestions.map((sg) => `  * ${sg}`).join('\n')}` : ''}`
    )
    .join('\n\n');

  const improvementFocus = evaluation.scores
    .filter((s) => s.score < 8)
    .map((s) => `- ${s.criterion}: ${s.suggestions?.[0] || s.feedback}`)
    .join('\n');

  const prompts = await getPromptsByType('optimization');

  const systemTemplate =
    prompts?.system.templateText ?? DEFAULT_PROMPTS.optimization.system;
  const userTemplate =
    prompts?.user.templateText ?? DEFAULT_PROMPTS.optimization.user;

  const data = {
    overallScore: evaluation.overallScore.toString(),
    iteration: evaluation.iteration.toString(),
    feedbackSummary,
    plan,
    draft,
    improvementFocus,
  };

  const systemPrompt = systemTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  const userPrompt = userTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

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
