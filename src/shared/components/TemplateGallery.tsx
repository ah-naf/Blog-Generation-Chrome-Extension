import { useState, useEffect } from 'react';
import { PromptTemplate } from '../types/promptTypes';
import { getPromptTemplates, savePromptTemplate, deletePromptTemplate, exportTemplates, importTemplates } from '../services/promptService';
import { PromptEditor } from './PromptEditor';
import { FileText, Download, Upload, Trash2, Edit, X, Save } from 'lucide-react';

interface TemplateGalleryProps {
  theme?: 'light' | 'dark';
}

export function TemplateGallery({ theme = 'dark' }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const loaded = await getPromptTemplates();
    setTemplates(loaded);
    setLoading(false);
  };

  const handleSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setEditingText(template.templateText);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    
    const updated = { ...selectedTemplate, templateText: editingText };
    await savePromptTemplate(updated);
    await loadTemplates();
    setSelectedTemplate(updated);
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deletePromptTemplate(id);
    if (success) {
      await loadTemplates();
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleExport = async () => {
    const json = await exportTemplates();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt-templates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    await importTemplates(text);
    await loadTemplates();
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(filter.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  const groupedTemplates = filteredTemplates.reduce((acc, t) => {
    const type = t.tags.find(tag => !['default', 'system', 'user'].includes(tag)) || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(t);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  const bg = theme === 'dark' ? '#1e1e1e' : '#fff';
  const border = theme === 'dark' ? '#333' : '#e0e0e0';
  const text = theme === 'dark' ? '#fff' : '#1f1f1f';
  const textMuted = theme === 'dark' ? '#888' : '#666';

  if (loading) {
    return <div style={{ padding: '20px', color: text }}>Loading templates...</div>;
  }

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      <div style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search templates..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${border}`,
            background: bg,
            color: text,
            fontSize: '14px',
          }}
        />
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExport}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '6px',
              border: `1px solid ${border}`,
              background: bg,
              color: text,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            <Download size={14} /> Export
          </button>
          <label style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px',
            borderRadius: '6px',
            border: `1px solid ${border}`,
            background: bg,
            color: text,
            cursor: 'pointer',
            fontSize: '12px',
          }}>
            <Upload size={14} /> Import
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(groupedTemplates).map(([type, items]) => (
            <div key={type}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: textMuted, marginBottom: '6px', letterSpacing: '0.5px' }}>
                {type.replace(/_/g, ' ')}
              </div>
              {items.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${selectedTemplate?.id === t.id ? '#4EC9B0' : border}`,
                    background: selectedTemplate?.id === t.id ? (theme === 'dark' ? '#2d3748' : '#e8f4f8') : bg,
                    marginBottom: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FileText size={14} style={{ color: textMuted }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '11px', color: textMuted }}>v{t.version} • {t.role}</div>
                  </div>
                  {!t.isDefault && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        position: 'sticky',
        top: '20px',
        alignSelf: 'flex-start',
        maxHeight: '100vh',
        overflow: 'auto'
      }}>
        {selectedTemplate ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: text, flex: 1 }}>{selectedTemplate.name}</h3>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#4EC9B0',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <Save size={14} /> Save
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditingText(selectedTemplate.templateText); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: `1px solid ${border}`,
                      background: bg,
                      color: text,
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    <X size={14} /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${border}`,
                    background: bg,
                    color: text,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <Edit size={14} /> Edit
                </button>
              )}
            </div>

            <PromptEditor
              template={{ ...selectedTemplate, templateText: editingText }}
              onChange={setEditingText}
              theme={theme}
              isEditing={isEditing}
            />
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: textMuted,
            fontSize: '14px',
          }}>
            Select a template to view and edit
          </div>
        )}
      </div>
    </div>
  );
}

export default TemplateGallery;
