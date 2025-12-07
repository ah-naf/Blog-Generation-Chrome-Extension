import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles, CheckCheck } from 'lucide-react';
import { ChatMessage } from '@/shared/types';

interface MessageBubbleProps {
  message: ChatMessage;
  onApplyDraft?: (content: string) => void;
}

export function MessageBubble({ message, onApplyDraft }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-primary-600 text-white rounded-tr-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none'
        }`}
      >
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
        <div
          className={`text-[10px] mt-1 ${
            isUser ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        {/* Apply Draft Button */}
        {!isUser && onApplyDraft && message.content.length > 50 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => onApplyDraft(message.content)}
              className="text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Use as Final Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
