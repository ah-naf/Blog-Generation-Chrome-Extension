import { useState, useEffect } from 'react';
import { PromptTemplate } from '../types/promptTypes';

interface PromptEditorProps {
  template: PromptTemplate;
  onChange: (templateText: string) => void;
  sampleData?: Record<string, string>;
  theme?: 'light' | 'dark';
  isEditing?: boolean;
}

export function PromptEditor({ template, onChange, sampleData = {}, theme = 'dark', isEditing = false }: PromptEditorProps) {
  const [preview, setPreview] = useState('');

  // Update preview when template or sample data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const rendered = template.templateText.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
          return sampleData[key.trim()] ?? `[${key.trim()}]`;
        });
        setPreview(rendered);
      } catch (e) {
        console.error('Error rendering preview:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [template.templateText, sampleData]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 border border-gray-700 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className={`px-3 py-2 border-b border-gray-700 dark:border-gray-700 flex justify-between items-center ${
          theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-gray-100'
        }`}>
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {template.name}
          </span>
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            v{template.version} • {template.role}
          </span>
        </div>
        <div className={`flex-1 relative flex flex-col ${theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          <textarea
            className={`flex-1 w-full p-3 font-mono text-sm resize-none focus:outline-none ${
              theme === 'dark' 
                ? 'bg-[#1e1e1e] text-[#d4d4d4] placeholder-gray-600' 
                : 'bg-white text-gray-900 placeholder-gray-400'
            } ${!isEditing ? 'cursor-default' : ''}`}
            value={template.templateText}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            placeholder="Enter your prompt template here..."
            readOnly={!isEditing}
          />
        </div>
      </div>
      
      <div className="border border-gray-700 dark:border-gray-700 rounded-lg overflow-hidden flex-shrink-0">
        <div className={`px-3 py-2 border-b border-gray-700 dark:border-gray-700 ${
          theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-gray-100'
        }`}>
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Preview</span>
          <span className={`ml-3 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            {preview.length} characters
          </span>
        </div>
        <div className={`p-3 max-h-[200px] overflow-auto whitespace-pre-wrap font-mono text-xs ${
          theme === 'dark' ? 'bg-[#0d1117] text-[#c9d1d9]' : 'bg-gray-50 text-gray-900'
        }`}>
          {preview}
        </div>
      </div>
    </div>
  );
}

export default PromptEditor;
