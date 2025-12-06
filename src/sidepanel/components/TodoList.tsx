import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { TodoItem } from '@/agent/blogAgent';

interface TodoListProps {
  todos: TodoItem[];
}

export function TodoList({ todos }: TodoListProps) {
  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo.id} className="flex items-start gap-2 text-sm">
          {todo.status === 'completed' ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          ) : todo.status === 'in_progress' ? (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <span className={`${
            todo.status === 'completed' ? 'text-gray-500 dark:text-gray-400 line-through' :
            todo.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400 font-medium' :
            'text-gray-700 dark:text-gray-300'
          }`}>
            {todo.description}
          </span>
        </li>
      ))}
    </ul>
  );
}
