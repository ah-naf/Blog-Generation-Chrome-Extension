import {
  PromptTemplate,
  PromptVersionHistory,
  PromptTemplateType,
} from '../types/promptTypes';
import { DEFAULT_PROMPTS } from '../prompts/defaultPrompts';

const PROMPT_TEMPLATES_KEY = 'prompt_templates';
const PROMPT_VERSIONS_KEY = 'prompt_versions';

export async function getPromptTemplates(): Promise<PromptTemplate[]> {
  const result = await chrome.storage.local.get(PROMPT_TEMPLATES_KEY);
  const stored = result[PROMPT_TEMPLATES_KEY] as PromptTemplate[] | undefined;

  if (!stored || stored.length === 0) {
    await initializeDefaultPrompts();
    const fresh = await chrome.storage.local.get(PROMPT_TEMPLATES_KEY);
    return fresh[PROMPT_TEMPLATES_KEY] || [];
  }

  return stored;
}

export async function getPromptTemplate(
  id: string
): Promise<PromptTemplate | undefined> {
  const templates = await getPromptTemplates();
  return templates.find((t) => t.id === id);
}

export async function getPromptsByType(
  type: PromptTemplateType
): Promise<{ system: PromptTemplate; user: PromptTemplate } | undefined> {
  const templates = await getPromptTemplates();
  const system = templates.find((t) => t.id === `${type}_system`);
  const user = templates.find((t) => t.id === `${type}_user`);

  if (system && user) {
    return { system, user };
  }
  return undefined;
}

export async function savePromptTemplate(
  template: PromptTemplate
): Promise<void> {
  const templates = await getPromptTemplates();
  const existingIndex = templates.findIndex((t) => t.id === template.id);

  const updatedTemplate = {
    ...template,
    version: existingIndex >= 0 ? templates[existingIndex].version + 1 : 1,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    await addVersionEntry(template.id, templates[existingIndex]);
    templates[existingIndex] = updatedTemplate;
  } else {
    updatedTemplate.createdAt = updatedTemplate.updatedAt;
    templates.push(updatedTemplate);
  }

  await chrome.storage.local.set({ [PROMPT_TEMPLATES_KEY]: templates });
}

export async function deletePromptTemplate(id: string): Promise<boolean> {
  const templates = await getPromptTemplates();
  const template = templates.find((t) => t.id === id);

  if (template?.isDefault) {
    return false;
  }

  const filtered = templates.filter((t) => t.id !== id);
  await chrome.storage.local.set({ [PROMPT_TEMPLATES_KEY]: filtered });
  return true;
}

export async function getVersionHistory(
  templateId: string
): Promise<PromptVersionHistory | undefined> {
  const result = await chrome.storage.local.get(PROMPT_VERSIONS_KEY);
  const histories = result[PROMPT_VERSIONS_KEY] as
    | PromptVersionHistory[]
    | undefined;
  return histories?.find((h) => h.templateId === templateId);
}

export async function rollbackToVersion(
  templateId: string,
  version: number
): Promise<boolean> {
  const history = await getVersionHistory(templateId);
  const versionEntry = history?.versions.find((v) => v.version === version);

  if (!versionEntry) return false;

  const template = await getPromptTemplate(templateId);
  if (!template) return false;

  const restored: PromptTemplate = {
    ...template,
    templateText: versionEntry.templateText,
  };

  await savePromptTemplate(restored);
  return true;
}

async function addVersionEntry(
  templateId: string,
  template: PromptTemplate
): Promise<void> {
  const result = await chrome.storage.local.get(PROMPT_VERSIONS_KEY);
  const histories =
    (result[PROMPT_VERSIONS_KEY] as PromptVersionHistory[]) || [];

  const historyIndex = histories.findIndex((h) => h.templateId === templateId);
  const entry = {
    version: template.version,
    templateText: template.templateText,
    updatedAt: template.updatedAt,
  };

  if (historyIndex >= 0) {
    histories[historyIndex].versions.push(entry);
    if (histories[historyIndex].versions.length > 20) {
      histories[historyIndex].versions.shift();
    }
  } else {
    histories.push({ templateId, versions: [entry] });
  }

  await chrome.storage.local.set({ [PROMPT_VERSIONS_KEY]: histories });
}

async function initializeDefaultPrompts(): Promise<void> {
  const templates: PromptTemplate[] = [];

  for (const [type, prompts] of Object.entries(DEFAULT_PROMPTS)) {
    templates.push({
      id: `${type}_system`,
      name: `${formatTypeName(type)} - System`,
      description: `System prompt for ${formatTypeName(type)} step`,
      templateText: prompts.system,
      role: 'system',
      version: 1,
      tags: [type, 'default'],
      variables: prompts.systemVariables || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
    });

    templates.push({
      id: `${type}_user`,
      name: `${formatTypeName(type)} - User`,
      description: `User prompt for ${formatTypeName(type)} step`,
      templateText: prompts.user,
      role: 'user',
      version: 1,
      tags: [type, 'default'],
      variables: prompts.userVariables || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
    });
  }

  await chrome.storage.local.set({ [PROMPT_TEMPLATES_KEY]: templates });
}

function formatTypeName(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function exportTemplates(): Promise<string> {
  const templates = await getPromptTemplates();
  return JSON.stringify(templates, null, 2);
}

export async function importTemplates(json: string): Promise<number> {
  const imported = JSON.parse(json) as PromptTemplate[];
  const existing = await getPromptTemplates();

  let count = 0;
  for (const template of imported) {
    const exists = existing.find((t) => t.id === template.id);
    if (!exists || !exists.isDefault) {
      await savePromptTemplate({ ...template, isDefault: false });
      count++;
    }
  }

  return count;
}
