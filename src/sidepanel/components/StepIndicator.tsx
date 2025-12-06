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
  { id: 'analyzing_sources', labelActive: 'Analyzing', labelCompleted: 'Analyzed', icon: Search },
  { id: 'creating_plan', labelActive: 'Planning', labelCompleted: 'Planned', icon: FileText },
  { id: 'creating_todos', labelActive: 'Creating Tasks', labelCompleted: 'Tasks Created', icon: ListTodo },
  { id: 'executing_draft', labelActive: 'Writing', labelCompleted: 'Written', icon: PenTool },
  { id: 'refining', labelActive: 'Refining', labelCompleted: 'Refined', icon: Wand2 },
  { id: 'evaluating', labelActive: 'Evaluating', labelCompleted: 'Evaluated', icon: Target },
  { id: 'optimizing', labelActive: 'Optimizing', labelCompleted: 'Optimized', icon: Zap },
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
    <div className="flex items-center justify-between relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
      {steps.map((step) => {
        const status = getStepStatus(step.id);
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800 px-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                status === 'completed'
                  ? 'bg-green-500 border-green-500 text-white'
                  : status === 'current'
                  ? 'bg-primary-600 border-primary-600 text-white animate-pulse'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
              }`}
            >
              {status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span
              className={`text-xs font-medium ${
                status === 'completed' || status === 'current'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {getStepLabel(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
