import { Target, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { EvaluationResult } from '@/agent/types';

interface EvaluationFeedbackProps {
  evaluation: EvaluationResult;
}

export function EvaluationFeedback({ evaluation }: EvaluationFeedbackProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 6) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <div className={`rounded-xl p-4 border ${getScoreBgColor(evaluation.overallScore)}`}>
      <div className="flex items-center gap-2 mb-3">
        <Target className={`w-5 h-5 ${getScoreColor(evaluation.overallScore)}`} />
        <h3 className="font-semibold text-sm uppercase tracking-wider">
          Quality Evaluation (Iteration {evaluation.iteration})
        </h3>
      </div>

      {/* Overall Score */}
      <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Score
          </span>
          <span className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
            {evaluation.overallScore.toFixed(1)}/10
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              evaluation.overallScore >= 8
                ? 'bg-green-500'
                : evaluation.overallScore >= 6
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${(evaluation.overallScore / 10) * 100}%` }}
          />
        </div>
        {evaluation.passThreshold ? (
          <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Quality threshold passed!</span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Optimization needed - Improving content...</span>
          </div>
        )}
      </div>

      {/* Detailed Scores */}
      <div className="space-y-2">
        {evaluation.scores.map((score, index) => (
          <div
            key={index}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {score.criterion}
              </span>
              <span className={`text-sm font-bold ${getScoreColor(score.score)}`}>
                {score.score}/10
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{score.feedback}</p>
            {score.suggestions && score.suggestions.length > 0 && score.score < 8 && (
              <div className="mt-2 pl-3 border-l-2 border-primary-300 dark:border-primary-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Suggestions:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {score.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <TrendingDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
