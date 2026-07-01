import { createContext, useContext } from 'react';
import type { Message } from '../types';
import type { ChatImagePayload } from '../utils/chat-images';

/** 高变更（流式更新频繁）的聊天状态上下文 — 与低变更的 ChatContext 分离，
 *  避免 streaming 过程中无关组件（侧边栏、设置面板等）不必要的重渲染。 */
export interface ChatMessagesContextValue {
  messages: Message[];
  loading: boolean;
  input: string;
  pendingImages: ChatImagePayload[];
  inputFocused: boolean;
  expandedThinkingMessageIds: Set<string>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  sendMessage: () => Promise<void>;
  stopGeneration: () => void;
  handleCopy: (content: string) => void;
  deleteMessage: (messageId: string) => void;
  regenerateMessage: (assistantMessageId: string) => Promise<void>;
  onToggleThinkingExpanded: (messageId: string) => void;
}

export const ChatMessagesContext = createContext<ChatMessagesContextValue | null>(null);

export function useChatMessages(): ChatMessagesContextValue {
  const ctx = useContext(ChatMessagesContext);
  if (!ctx) {
    throw new Error('useChatMessages must be used within ChatProvider');
  }
  return ctx;
}
