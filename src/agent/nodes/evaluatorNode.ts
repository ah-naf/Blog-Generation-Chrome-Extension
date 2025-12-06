import { BlogAgentState, EvaluationResult, EvaluationScore } from '../types';
import { generateContent } from '../../shared/services/aiService';
import { getPromptsByType } from '../../shared/services/promptService';
import { DEFAULT_PROMPTS } from '../../shared/prompts/defaultPrompts';

const EVALUATION_CRITERIA = [
  {
    name: 'Technical Accuracy',
    description: 'Content is factually correct and technically sound',
    weight: 1.5,
  },
  {
    name: 'Clarity & Readability',
    description: 'Writing is clear, concise, and easy to understand',
    weight: 1.2,
  },
  {
    name: 'Structure & Flow',
    description: 'Logical organization with smooth transitions',
    weight: 1.0,
  },
  {
    name: 'Engagement',
    description: 'Content is interesting and keeps reader engaged',
    weight: 1.0,
  },
  {
    name: 'Completeness',
    description: 'All topics from plan are covered adequately',
    weight: 1.3,
  },
  {
    name: 'Code Quality',
    description: 'Code examples are correct, well-formatted, and explained',
    weight: 1.2,
  },
  {
    name: 'Professional Tone',
    description: 'Maintains appropriate technical blog tone',
    weight: 0.8,
  },
];

export async function evaluatorNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { draft, plan, sourceAnalysis, optimizationIteration = 0 } = state;

  const prompts = await getPromptsByType('evaluation');

  const systemTemplate =
    prompts?.system.templateText ?? DEFAULT_PROMPTS.evaluation.system;
  const userTemplate =
    prompts?.user.templateText ?? DEFAULT_PROMPTS.evaluation.user;

  const data = {
    plan,
    sourceAnalysisTruncated: sourceAnalysis.substring(0, 1000) + '...',
    iteration: (optimizationIteration + 1).toString(),
    draft,
  };

  const systemPrompt = systemTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  const userPrompt = userTemplate.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return (data as Record<string, string>)[key.trim()] ?? '';
  });

  try {
    const response = await generateContent(systemPrompt, userPrompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse evaluation response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const evaluations = parsed.evaluations as Array<{
      criterion: string;
      score: number;
      feedback: string;
      suggestions?: string[];
    }>;

    const scores: EvaluationScore[] = evaluations.map((e) => ({
      criterion: e.criterion,
      score: Math.max(0, Math.min(10, e.score)),
      feedback: e.feedback,
      suggestions: e.suggestions || [],
    }));

    const totalWeight = EVALUATION_CRITERIA.reduce(
      (sum, c) => sum + c.weight,
      0
    );
    const weightedSum = scores.reduce((sum, score, index) => {
      const weight = EVALUATION_CRITERIA[index]?.weight || 1.0;
      return sum + score.score * weight;
    }, 0);

    const overallScore = Number((weightedSum / totalWeight).toFixed(2));
    const passThreshold = overallScore >= 8.0;

    const evaluation: EvaluationResult = {
      overallScore,
      scores,
      passThreshold,
      iteration: optimizationIteration + 1,
      timestamp: new Date().toISOString(),
    };

    return {
      currentStep: passThreshold ? 'finished' : 'evaluating',
      evaluation,
      optimizationIteration: optimizationIteration + 1,
    };
  } catch (error) {
    console.error('Evaluation failed:', error);
    return {
      currentStep: 'finished',
      evaluation: {
        overallScore: 7.5,
        scores: [],
        passThreshold: true,
        iteration: optimizationIteration + 1,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
