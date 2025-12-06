import { useState, useRef, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { PromptTemplate } from '../types/promptTypes';

interface PromptEditorProps {
  template: PromptTemplate;
  onChange: (templateText: string) => void;
  sampleData?: Record<string, string>;
  theme?: 'light' | 'dark';
}

export function PromptEditor({ template, onChange, sampleData = {}, theme = 'dark' }: PromptEditorProps) {
  const [preview, setPreview] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  useEffect(() => {
    const rendered = template.templateText.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      return sampleData[key.trim()] ?? `[${key.trim()}]`;
    });
    setPreview(rendered);
  }, [template.templateText, sampleData]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.languages.register({ id: 'promptTemplate' });

    monaco.languages.setMonarchTokensProvider('promptTemplate', {
      tokenizer: {
        root: [
          [/\{\{[^}]+\}\}/, 'variable'],
          [/\*\*[^*]+\*\*/, 'bold'],
          [/^#{1,3}\s.*$/, 'heading'],
          [/^-\s/, 'list'],
          [/^\d+\.\s/, 'list'],
        ],
      },
    });

    monaco.editor.defineTheme('promptDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'variable', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'bold', foreground: 'D4D4D4', fontStyle: 'bold' },
        { token: 'heading', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'list', foreground: 'D7BA7D' },
      ],
      colors: {},
    });

    monaco.editor.defineTheme('promptLight', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'variable', foreground: '16825D', fontStyle: 'bold' },
        { token: 'bold', foreground: '1F1F1F', fontStyle: 'bold' },
        { token: 'heading', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'list', foreground: 'B5200D' },
      ],
      colors: {},
    });

    monaco.editor.setTheme(theme === 'dark' ? 'promptDark' : 'promptLight');

    const variables = template.variables.map(v => ({
      label: `{{${v.name}}}`,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: `{{${v.name}}}`,
      detail: v.description,
      documentation: `Type: ${v.type}${v.required ? ' (required)' : ''}${v.default ? `, Default: ${v.default}` : ''}`,
    }));

    monaco.languages.registerCompletionItemProvider('promptTemplate', {
      triggerCharacters: ['{'],
      provideCompletionItems: (model: editor.ITextModel, position: { lineNumber: number; column: number }) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: Math.max(1, position.column - 2),
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        
        if (textUntilPosition.includes('{')) {
          return { suggestions: variables.map(v => ({ ...v, range: undefined! })) };
        }
        return { suggestions: [] };
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="prompt-editor" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ flex: 1, border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #333', background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5' }}>
          <span style={{ fontWeight: 600, color: theme === 'dark' ? '#fff' : '#1f1f1f' }}>
            {template.name}
          </span>
          <span style={{ marginLeft: '12px', color: theme === 'dark' ? '#888' : '#666', fontSize: '12px' }}>
            v{template.version} • {template.role}
          </span>
        </div>
        <Editor
          height="300px"
          language="promptTemplate"
          value={template.templateText}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'promptDark' : 'promptLight'}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'on',
            wordWrap: 'on',
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
      
      <div style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #333', background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5' }}>
          <span style={{ fontWeight: 600, color: theme === 'dark' ? '#fff' : '#1f1f1f' }}>Preview</span>
          <span style={{ marginLeft: '12px', color: theme === 'dark' ? '#888' : '#666', fontSize: '12px' }}>
            {preview.length} characters
          </span>
        </div>
        <div style={{
          padding: '12px',
          maxHeight: '200px',
          overflow: 'auto',
          background: theme === 'dark' ? '#0d1117' : '#fafafa',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: theme === 'dark' ? '#c9d1d9' : '#24292f',
        }}>
          {preview}
        </div>
      </div>
    </div>
  );
}

export default PromptEditor;
