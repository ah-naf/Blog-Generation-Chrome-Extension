import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { ChatMessage } from '@/shared/types';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onApplyDraft?: (content: string) => void;
  onBack: () => void;
  isStreaming: boolean;
}

export function ChatInterface({ messages, onSendMessage, onApplyDraft, onBack, isStreaming }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Smart Scroll: only auto-scroll if user is near bottom or it's a new message
  // Also fix stuttering by not scrolling on every stream chunk if not already at bottom.
  useEffect(() => {
    // Basic auto-scroll on new message added (length changed)
    scrollToBottom();
  }, [messages.length]); // NOT isStreaming - avoids stutter during streaming

  // Optional: keep scrolling if already at bottom during streaming?
  // For now, simpler is better: scroll only when new message starts, or if they manually scroll.


  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <button
          onClick={onBack}
          className="mr-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          title="Back to Draft"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Refine Draft</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ask for changes or details</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
              Start refining your draft
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ask me to expand sections, change the tone, or add specific details.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onApplyDraft={onApplyDraft}
          />
        ))}
        
        {isStreaming && (
          <div className="flex justify-start">
             <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
               <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all shadow-sm"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe changes or ask a question..."
            className="flex-1 max-h-32 min-h-[44px] py-2.5 px-3 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
            rows={1}
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white transition-all duration-200 flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-center mt-2 text-gray-400 dark:text-gray-500">
          Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

// Needed for the Sparkles icon in the empty state
import { Sparkles } from 'lucide-react';
