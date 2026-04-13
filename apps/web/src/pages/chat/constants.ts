import { VendorType, type ChatSession, type ModelVendor } from './types';
import { canonicalAssistantMarkdown } from './utils/assistant-markdown';

export const STORAGE_KEY = 'chat_sessions';
export const MAX_SESSIONS = 50;

export const MODEL_VENDORS: ModelVendor[] = [
  {
    label: 'OpenAI',
    value: VendorType.OPENAI,
    models: [
      { label: 'GPT-5 Chat (latest)', value: 'gpt-5-chat-latest' },
      { label: 'GPT-5', value: 'gpt-5' },
      { label: 'GPT-5 mini', value: 'gpt-5-mini' },
    ],
  },
  {
    label: 'Anthropic',
    value: VendorType.ANTHROPIC,
    models: [
      { label: 'Claude Opus 4.6', value: 'claude-opus-4-6' },
      { label: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
      { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5' },
    ],
  },
  {
    label: 'Gemini',
    value: VendorType.GEMINI,
    models: [
      { label: 'Gemini 3.1 Pro (preview)', value: 'gemini-3.1-pro-preview' },
      { label: 'Gemini 3 Flash (preview)', value: 'gemini-3-flash-preview' },
      {
        label: 'Gemini 3.1 Flash Lite (preview)',
        value: 'gemini-3.1-flash-lite-preview',
      },
    ],
  },
  {
    label: 'DeepSeek',
    value: VendorType.DEEPSEEK,
    models: [
      { label: 'DeepSeek Chat (V3.2)', value: 'deepseek-chat' },
      { label: 'DeepSeek Reasoner (V3.2)', value: 'deepseek-reasoner' },
    ],
  },
  {
    label: 'Qwen',
    value: VendorType.QWEN,
    models: [
      { label: 'Qwen Max (latest)', value: 'qwen-max-latest' },
      { label: 'Qwen Plus (latest)', value: 'qwen-plus-latest' },
    ],
  },
  {
    label: 'MiniMax',
    value: VendorType.MINIMAX,
    models: [
      { label: 'MiniMax M2.7', value: 'MiniMax-M2.7' },
      { label: 'MiniMax M2.5', value: 'MiniMax-M2.5' },
    ],
  },
];

export function sessionsForLocalStorage(sessions: ChatSession[]): ChatSession[] {
  return sessions.map((s) => ({
    ...s,
    messages: s.messages.map(
      ({ images: _i, webSearchStatus: _w, ...m }) => {
        const { thinkingStatus: _ts, ...rest } = m as typeof m & { thinkingStatus?: string };
        void _ts;
        const displayContent =
          rest.role === 'assistant'
            ? canonicalAssistantMarkdown(rest.content, rest.displayContent)
            : (rest.displayContent ?? rest.content);
        return { ...rest, displayContent, thinkingStatus: 'done' as const };
      },
    ),
  }));
}

/** 当前所有已接入 provider 均允许聊天配图，由后端按 provider 路由。 */
export function isChatImageSupportedVendor(vendor: VendorType): boolean {
  void vendor;
  return true;
}

export function isVendorType(value: string): value is VendorType {
  return Object.values(VendorType).includes(value as VendorType);
}
