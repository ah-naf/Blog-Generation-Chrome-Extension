import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';
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
    groq: 'openai/gpt-oss-120b',
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

export async function* streamChat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  const settings = await getAISettings();
  const { provider, apiKeys, baseUrl } = settings;

  let model;

  switch (provider) {
    case 'openai':
      if (!apiKeys.openai) throw new Error('OpenAI API key not found');
      model = new ChatOpenAI({
        openAIApiKey: apiKeys.openai,
        modelName: settings.models.openai,
        streaming: true,
        configuration: {
          baseURL: baseUrl,
        },
      });
      break;
    case 'groq':
      if (!apiKeys.groq) throw new Error('Groq API key not found');
      model = new ChatOpenAI({
        apiKey: apiKeys.groq,
        modelName: settings.models.groq,
        streaming: true,
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
        streaming: true,
      });
      break;
  }

  const langchainMessages = messages.map((m) => {
    if (m.role === 'user') return new HumanMessage(m.content);
    if (m.role === 'assistant') return new AIMessage(m.content);
    return new SystemMessage(m.content);
  });
  if (systemPrompt) {
    langchainMessages.unshift(new SystemMessage(systemPrompt));
  }

  const stream = await model.stream(langchainMessages);

  for await (const chunk of stream) {
    if (typeof chunk.content === 'string') {
      yield chunk.content;
    }
  }
}
