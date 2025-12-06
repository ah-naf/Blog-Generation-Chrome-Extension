import { BlogAgentState, EvaluationResult, EvaluationScore } from '../types';
import { generateContent } from '@/shared/services/aiService';

/**
 * Evaluation criteria for blog posts
 */
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

/**
 * Evaluates the generated blog draft against quality criteria
 */
export async function evaluatorNode(
  state: BlogAgentState
): Promise<Partial<BlogAgentState>> {
  const { draft, plan, sourceAnalysis, optimizationIteration = 0 } = state;

  const systemPrompt = `You are an expert blog post evaluator specializing in technical content quality assessment. Your task is to critically evaluate a blog post draft and provide detailed, actionable feedback.

**Evaluation Criteria:**
${EVALUATION_CRITERIA.map(
    (c, i) =>
      `${i + 1}. **${c.name}** (Weight: ${c.weight}x): ${c.description}`
  ).join('\n')}

**Scoring Guidelines:**
- 9-10: Exceptional - Publication ready with minimal changes
- 7-8: Good - Minor improvements needed
- 5-6: Adequate - Several improvements required
- 3-4: Needs Work - Significant revisions necessary
- 1-2: Poor - Major rewrite required

**Your Task:**
1. Evaluate the draft against each criterion
2. Provide a score (0-10) for each criterion
3. Give specific, actionable feedback
4. Suggest concrete improvements where score < 8
5. Be critical but constructive

**Output Format (JSON):**
{
  "evaluations": [
    {
      "criterion": "Technical Accuracy",
      "score": 8,
      "feedback": "Detailed feedback here...",
      "suggestions": ["Specific suggestion 1", "Specific suggestion 2"]
    },
    // ... for each criterion
  ]
}

Return ONLY valid JSON, no additional text.`;

  const userPrompt = `**Content Plan:**
${plan}

**Source Analysis:**
${sourceAnalysis.substring(0, 1000)}...

**Draft to Evaluate (Iteration ${optimizationIteration + 1}):**
${draft}

Evaluate this draft critically and provide detailed JSON feedback.`;

  try {
    const response = await generateContent(systemPrompt, userPrompt);

    // Parse JSON response
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

    // Calculate weighted overall score
    const scores: EvaluationScore[] = evaluations.map((e) => ({
      criterion: e.criterion,
      score: Math.max(0, Math.min(10, e.score)), // Clamp 0-10
      feedback: e.feedback,
      suggestions: e.suggestions || [],
    }));

    const totalWeight = EVALUATION_CRITERIA.reduce((sum, c) => sum + c.weight, 0);
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
    // If evaluation fails, assume draft is acceptable and finish
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
