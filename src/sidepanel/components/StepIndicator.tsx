import { CheckCircle2, Search, FileText, ListTodo, PenTool, Wand2, Target, Zap, LucideIcon } from 'lucide-react';
import { BlogAgentState } from '@/agent/blogAgent';

interface Step {
  id: string;
  labelActive: string;
  labelCompleted: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  currentStep: BlogAgentState['currentStep'];
}

const steps: Step[] = [
  { id: 'analyzing_sources', labelActive: 'Analyze', labelCompleted: 'Done', icon: Search },
  { id: 'creating_plan', labelActive: 'Plan', labelCompleted: 'Done', icon: FileText },
  { id: 'creating_todos', labelActive: 'Tasks', labelCompleted: 'Done', icon: ListTodo },
  { id: 'executing_draft', labelActive: 'Write', labelCompleted: 'Done', icon: PenTool },
  { id: 'refining', labelActive: 'Refine', labelCompleted: 'Done', icon: Wand2 },
  { id: 'evaluating', labelActive: 'Evaluate', labelCompleted: 'Done', icon: Target },
  { id: 'optimizing', labelActive: 'Optimize', labelCompleted: 'Done', icon: Zap },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const getStepStatus = (stepId: string) => {
    const stepOrder = ['analyzing_sources', 'creating_plan', 'creating_todos', 'executing_draft', 'refining', 'evaluating', 'optimizing', 'finished'];
    const currentIndex = stepOrder.indexOf(currentStep || 'analyzing_sources');
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'pending';
  };

  const getStepLabel = (step: Step) => {
    const status = getStepStatus(step.id);
    if (status === 'completed') return step.labelCompleted;
    return step.labelActive;
  };

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex items-center gap-1 min-w-max py-1">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                    status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : status === 'current'
                      ? 'bg-primary-600 border-primary-600 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    status === 'completed' || status === 'current'
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {getStepLabel(step)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-4 h-0.5 mx-1 flex-shrink-0 ${
                    getStepStatus(steps[index + 1].id) === 'pending'
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'bg-green-500'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

