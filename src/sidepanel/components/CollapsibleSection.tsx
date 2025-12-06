import { ReactNode } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

interface CollapsibleSectionProps {
  icon: LucideIcon;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  headerColor?: string;
  borderAccent?: boolean;
  canCollapse?: boolean;
}

export function CollapsibleSection({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  children,
  headerColor = 'text-primary-600 dark:text-primary-400',
  borderAccent = false,
  canCollapse = true,
}: CollapsibleSectionProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
      borderAccent ? 'border-l-4 border-l-green-500' : ''
    }`}>
      <button
        onClick={canCollapse ? onToggle : undefined}
        disabled={!canCollapse}
        className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
          canCollapse ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''
        }`}
      >
        <div className={`flex items-center gap-2 ${headerColor}`}>
          <Icon className="w-4 h-4" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
        </div>
        {canCollapse && (
          isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
