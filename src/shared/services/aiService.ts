import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AISettings } from '../types/index';

const AI_SETTINGS_KEY = 'ai_settings';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKeys: {
    gemini: '',
    openai: '',
    groq: '',
  },
  models: {
    gemini: 'gemini-2.0-flash', // Updated to latest flash model
    openai: 'gpt-4o',
    groq: 'llama3-70b-8192',
  },
};

export async function getAISettings(): Promise<AISettings> {
  const result = await chrome.storage.local.get(AI_SETTINGS_KEY);
  return { ...DEFAULT_AI_SETTINGS, ...result[AI_SETTINGS_KEY] };
}

export async function saveAISettings(settings: AISettings): Promise<void> {
  await chrome.storage.local.set({ [AI_SETTINGS_KEY]: settings });
}

export async function generateContent(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const settings = await getAISettings();
  const { provider, apiKeys, baseUrl } = settings;

  let model;

  switch (provider) {
    case 'openai':
      if (!apiKeys.openai) throw new Error('OpenAI API key not found');
      model = new ChatOpenAI({
        openAIApiKey: apiKeys.openai,
        modelName: settings.models.openai,
        configuration: {
          baseURL: baseUrl,
        },
      });
      break;
    case 'groq':
      if (!apiKeys.groq) throw new Error('Groq API key not found');
      // Groq is OpenAI compatible
      model = new ChatOpenAI({
        apiKey: apiKeys.groq,
        modelName: settings.models.groq,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        },
        dangerouslyAllowBrowser: true,
      } as any);
      break;
    case 'gemini':
    default:
      if (!apiKeys.gemini) throw new Error('Gemini API key not found');
      model = new ChatGoogleGenerativeAI({
        apiKey: apiKeys.gemini,
        model: settings.models.gemini,
      });
      break;
  }

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  const response = await model.invoke(messages);
  return typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);
}
