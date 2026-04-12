import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { useAppSelector } from '@/store/reduxHooks';
import {
  STORAGE_KEY,
  MAX_SESSIONS,
  sessionsForLocalStorage,
  isVendorType,
} from '../constants';
import { parseSSEChunk } from '../utils/stream-utils';
import {
  mergeBlogPublishDraftWithStrippedBody,
  parseAbnerBlogPublishDraft,
  stripAbnerBlogPublishBlock,
} from '../utils/parse-blog-publish-block';
import { handleChatStreamEvent } from '../utils/stream-event-handler';
import { requestAIChatStream, saveAIConfig, getAIConfig } from '@services/ai';
import { type ChatSession, type Message, type IntentName, type VendorType } from '../types';
import { type ChatImagePayload } from '../utils/chat-images';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  input: string;
  pendingImages: ChatImagePayload[];
  inputFocused: boolean;
  loading: boolean;
  showSettings: boolean;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  // Config
  apiKeys: Record<string, string>;
  hasApiKeyByProvider: Record<string, boolean>;
  vendor: VendorType;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  thinkingBudget: number;
  enableThinking: boolean;
  useMcpTools: boolean;
  expandedThinkingMessageIds: Set<string>;
  // Panels
  showKnowledgeBase: boolean;
  showMCPServer: boolean;
  showSkill: boolean;
  showChatSettings: boolean;
}

type ChatAction =
  | { type: 'SET_SESSIONS'; payload: ChatSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: { sessionId: string; messages: Message[] } }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'UPDATE_MESSAGES'; payload: Message[] }
  | { type: 'UPDATE_MESSAGES_BATCH'; payload: (prev: Message[]) => Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_PENDING_IMAGES'; payload: ChatImagePayload[] }
  | { type: 'SET_INPUT_FOCUSED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'SET_MOBILE_DRAWER_OPEN'; payload: boolean }
  | { type: 'SET_API_KEYS'; payload: Record<string, string> }
  | { type: 'SET_HAS_API_KEY_BY_PROVIDER'; payload: Record<string, boolean> }
  | { type: 'SET_VENDOR'; payload: VendorType }
  | { type: 'SET_MODEL'; payload: string }
  | { type: 'SET_TEMPERATURE'; payload: number }
  | { type: 'SET_MAX_TOKENS'; payload: number }
  | { type: 'SET_CONTEXT_WINDOW'; payload: number }
  | { type: 'SET_THINKING_BUDGET'; payload: number }
  | { type: 'SET_ENABLE_THINKING'; payload: boolean }
  | { type: 'SET_USE_MCP_TOOLS'; payload: boolean }
  | { type: 'TOGGLE_THINKING_EXPANDED'; payload: string }
  | { type: 'SET_SHOW_KNOWLEDGE_BASE'; payload: boolean }
  | { type: 'SET_SHOW_MCP_SERVER'; payload: boolean }
  | { type: 'SET_SHOW_SKILL'; payload: boolean }
  | { type: 'SET_SHOW_CHAT_SETTINGS'; payload: boolean }
  | { type: 'ADD_SESSION'; payload: ChatSession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'UPDATE_SESSION'; payload: { id: string; updates: Partial<ChatSession> } };

const TYPEWRITER_BATCH_SIZE = 4;
const TYPEWRITER_TICK_MS = 42;

const initialState: ChatState = {
  sessions: [],
  currentSessionId: null,
  messages: [],
  input: '',
  pendingImages: [],
  inputFocused: false,
  loading: false,
  showSettings: false,
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  apiKeys: {},
  hasApiKeyByProvider: {},
  vendor: 'minimax' as VendorType,
  model: 'MiniMax-M2.5',
  temperature: 7,
  maxTokens: 4096,
  contextWindow: 10,
  thinkingBudget: 0,
  enableThinking: true,
  useMcpTools: false,
  expandedThinkingMessageIds: new Set(),
  showKnowledgeBase: false,
  showMCPServer: false,
  showSkill: false,
  showChatSettings: false,
};

const normalizeHydratedMessages = (messages: Message[]): Message[] =>
  messages.map((m) => ({
    ...m,
    displayContent: m.displayContent ?? m.content,
    isComplete: true,
    thinkingStatus: m.thinkingStatus === 'streaming' ? 'done' : m.thinkingStatus,
    answerStatus: m.answerStatus === 'streaming' ? 'done' : m.answerStatus,
    webSearchStatus: m.webSearchStatus === 'searching' ? 'done' : m.webSearchStatus,
  }));

const isSessionEmpty = (session: ChatSession): boolean => {
  if (!Array.isArray(session.messages) || session.messages.length === 0) {
    return true;
  }

  return !session.messages.some((msg) => {
    if (msg.role !== 'user') return false;
    const hasText = Boolean(msg.content?.trim());
    const hasImages = Array.isArray(msg.images) && msg.images.length > 0;
    return hasText || hasImages;
  });
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSessionId: action.payload.sessionId,
        messages: action.payload.messages,
      };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'UPDATE_MESSAGES':
      return { ...state, messages: action.payload };
    case 'UPDATE_MESSAGES_BATCH':
      return { ...state, messages: action.payload(state.messages) };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
      };
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'SET_PENDING_IMAGES':
      return { ...state, pendingImages: action.payload };
    case 'SET_INPUT_FOCUSED':
      return { ...state, inputFocused: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SHOW_SETTINGS':
      return { ...state, showSettings: action.payload };
    case 'SET_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: action.payload };
    case 'SET_MOBILE_DRAWER_OPEN':
      return { ...state, mobileDrawerOpen: action.payload };
    case 'SET_API_KEYS':
      return { ...state, apiKeys: action.payload };
    case 'SET_HAS_API_KEY_BY_PROVIDER':
      return { ...state, hasApiKeyByProvider: action.payload };
    case 'SET_VENDOR':
      return { ...state, vendor: action.payload };
    case 'SET_MODEL':
      return { ...state, model: action.payload };
    case 'SET_TEMPERATURE':
      return { ...state, temperature: action.payload };
    case 'SET_MAX_TOKENS':
      return { ...state, maxTokens: action.payload };
    case 'SET_CONTEXT_WINDOW':
      return { ...state, contextWindow: action.payload };
    case 'SET_THINKING_BUDGET':
      return { ...state, thinkingBudget: action.payload };
    case 'SET_ENABLE_THINKING':
      return { ...state, enableThinking: action.payload };
    case 'SET_USE_MCP_TOOLS':
      return { ...state, useMcpTools: action.payload };
    case 'TOGGLE_THINKING_EXPANDED': {
      const newSet = new Set(state.expandedThinkingMessageIds);
      if (newSet.has(action.payload)) {
        newSet.delete(action.payload);
      } else {
        newSet.add(action.payload);
      }
      return { ...state, expandedThinkingMessageIds: newSet };
    }
    case 'SET_SHOW_KNOWLEDGE_BASE':
      return { ...state, showKnowledgeBase: action.payload };
    case 'SET_SHOW_MCP_SERVER':
      return { ...state, showMCPServer: action.payload };
    case 'SET_SHOW_SKILL':
      return { ...state, showSkill: action.payload };
    case 'SET_SHOW_CHAT_SETTINGS':
      return { ...state, showChatSettings: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions] };
    case 'DELETE_SESSION':
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.payload) };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        ),
      };
    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  /** 将当前会话的 messages 写入 sessions 并落盘（例如发布成功后刷新仍保留状态） */
  persistCurrentChatToStorage: (messagePatch?: {
    id: string;
    updates: Partial<Message>;
  }) => void;
  // Actions
  createNewSession: () => void;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  sendMessage: () => Promise<void>;
  stopGeneration: () => void;
  handleCopy: (content: string) => void;
  deleteMessage: (messageId: string) => void;
  regenerateMessage: (assistantMessageId: string) => Promise<void>;
  handleSaveSettings: () => Promise<void>;
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  theme: string;
  isDark: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { t } = useTranslation();
  const { theme } = useAppSelector((s) => s.theme);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typeWriterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTypeTextRef = useRef('');
  const streamCompletedRef = useRef(false);
  const activeAssistantIdRef = useRef<string | null>(null);

  // Refs for latest state (avoid closure issues)
  const stateRef = useRef(state);
  stateRef.current = state;

  const isDark = useMemo(() => {
    return (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme]);

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed.length > 0) {
          const normalizedSessions = parsed.map((session: ChatSession) => ({
            ...session,
            messages: normalizeHydratedMessages(session.messages || []),
          }));
          const first = normalizedSessions[0];
          dispatch({ type: 'SET_SESSIONS', payload: normalizedSessions });
          dispatch({
            type: 'SET_CURRENT_SESSION',
            payload: {
              sessionId: first.id,
              messages: first.messages,
            },
          });
        } else {
          createNewSessionInternal();
        }
      } catch {
        createNewSessionInternal();
      }
    } else {
      createNewSessionInternal();
    }
  }, []);

  const createNewSessionInternal = useCallback(() => {
    const welcomeContent = t('chat.welcome', {
      defaultValue: '你好！我是 AI 助手，有什么可以帮助你的吗？',
    });
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: welcomeContent,
          displayContent: welcomeContent,
          timestamp: Date.now(),
          isComplete: true,
        },
      ],
      timestamp: Date.now(),
      model: stateRef.current.model,
    };
    dispatch({ type: 'SET_SESSIONS', payload: [newSession] });
    dispatch({
      type: 'SET_CURRENT_SESSION',
      payload: {
        sessionId: newSession.id,
        messages: newSession.messages,
      },
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsForLocalStorage([newSession])));
  }, [t]);

  const saveSessions = useCallback((newSessions: ChatSession[]) => {
    const limitedSessions = newSessions.slice(0, MAX_SESSIONS);
    dispatch({ type: 'SET_SESSIONS', payload: limitedSessions });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsForLocalStorage(limitedSessions)));
  }, []);

  const persistCurrentChatToStorage = useCallback(
    (messagePatch?: { id: string; updates: Partial<Message> }) => {
      const { currentSessionId, sessions } = stateRef.current;
      if (!currentSessionId) return;
      let { messages } = stateRef.current;
      if (messagePatch) {
        messages = messages.map((m) =>
          m.id === messagePatch.id ? { ...m, ...messagePatch.updates } : m,
        );
      }
      const next = sessions.map((s) =>
        s.id === currentSessionId ? { ...s, messages, timestamp: Date.now() } : s,
      );
      saveSessions(next);
    },
    [saveSessions],
  );

  const createNewSession = useCallback(() => {
    const existingEmptySession = stateRef.current.sessions.find(isSessionEmpty);
    if (existingEmptySession) {
      dispatch({
        type: 'SET_CURRENT_SESSION',
        payload: {
          sessionId: existingEmptySession.id,
          messages: normalizeHydratedMessages(existingEmptySession.messages || []),
        },
      });
      return;
    }

    const welcomeContent = t('chat.welcome', {
      defaultValue: '你好！我是 AI 助手，有什么可以帮助你的吗？',
    });
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: welcomeContent,
          displayContent: welcomeContent,
          timestamp: Date.now(),
          isComplete: true,
        },
      ],
      timestamp: Date.now(),
      model: stateRef.current.model,
    };
    saveSessions([newSession, ...stateRef.current.sessions]);
    dispatch({
      type: 'SET_CURRENT_SESSION',
      payload: {
        sessionId: newSession.id,
        messages: newSession.messages,
      },
    });
  }, [t, saveSessions]);

  const switchSession = useCallback((sessionId: string) => {
    const session = stateRef.current.sessions.find((s) => s.id === sessionId);
    if (session) {
      const normalizedMessages = normalizeHydratedMessages(session.messages || []);
      dispatch({
        type: 'SET_CURRENT_SESSION',
        payload: {
          sessionId,
          messages: normalizedMessages,
        },
      });
    }
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    const newSessions = stateRef.current.sessions.filter((s) => s.id !== sessionId);
    saveSessions(newSessions);
    if (stateRef.current.currentSessionId === sessionId) {
      if (newSessions.length > 0) {
        switchSession(newSessions[0].id);
      } else {
        createNewSession();
      }
    }
  }, [saveSessions, switchSession, createNewSession]);

  const stopTypeWriter = useCallback(() => {
    if (typeWriterTimerRef.current) {
      clearTimeout(typeWriterTimerRef.current);
      typeWriterTimerRef.current = null;
    }
    pendingTypeTextRef.current = '';
    streamCompletedRef.current = false;
    activeAssistantIdRef.current = null;
  }, []);

  const runTypeWriter = useCallback((assistantMessageId: string) => {
    if (typeWriterTimerRef.current) return;
    activeAssistantIdRef.current = assistantMessageId;

    const tick = () => {
      if (!pendingTypeTextRef.current) {
        typeWriterTimerRef.current = null;
        if (streamCompletedRef.current && activeAssistantIdRef.current === assistantMessageId) {
          const current = stateRef.current.messages.find((m) => m.id === assistantMessageId);
          const updates: Partial<Message> = { isComplete: true };
          if (current?.role === 'assistant' && current.content) {
            const draftRaw = parseAbnerBlogPublishDraft(current.content);
            if (draftRaw) {
              const stripped = stripAbnerBlogPublishBlock(current.content);
              updates.blogPublishDraft = mergeBlogPublishDraftWithStrippedBody(
                draftRaw,
                stripped,
              );
              if (stripped.trim()) {
                updates.content = stripped;
                updates.displayContent = stripped;
              }
            }
          }
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { id: assistantMessageId, updates },
          });
          streamCompletedRef.current = false;
        }
        return;
      }
      const chunk = pendingTypeTextRef.current.slice(0, TYPEWRITER_BATCH_SIZE);
      pendingTypeTextRef.current = pendingTypeTextRef.current.slice(TYPEWRITER_BATCH_SIZE);
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: assistantMessageId,
          updates: { displayContent: (stateRef.current.messages.find(m => m.id === assistantMessageId)?.displayContent || '') + chunk },
        },
      });
      typeWriterTimerRef.current = setTimeout(tick, TYPEWRITER_TICK_MS);
    };
    typeWriterTimerRef.current = setTimeout(tick, TYPEWRITER_TICK_MS);
  }, []);

  const formatAiStreamErrorPayload = useCallback((payload: Record<string, unknown> | undefined): string => {
    const code = typeof payload?.errorCode === 'string' ? payload.errorCode : '';
    const fallback = typeof payload?.error === 'string' ? payload.error : '';
    if (code) {
      return t(`chat.errors.${code}`, { defaultValue: fallback || t('chat.streamErrorFallback') });
    }
    if (
      fallback &&
      /new_sensitive|output new_sensitive|\(\s*1027\s*\)|\b1027\b/i.test(fallback)
    ) {
      return t('chat.errors.MINIMAX_OUTPUT_SENSITIVE');
    }
    return fallback || t('chat.streamErrorFallback');
  }, [t]);

  const formatErrorReasonForDisplay = useCallback((reason: string): string => {
    const raw = reason.trim();
    const jsonStartIndex = raw.indexOf('{');
    if (jsonStartIndex <= 0) return raw;

    const prefix = raw.slice(0, jsonStartIndex).trimEnd();
    const maybeJson = raw.slice(jsonStartIndex).trim();
    try {
      const parsed = JSON.parse(maybeJson) as unknown;
      const prettyJson = JSON.stringify(parsed, null, 2);
      return `${prefix}\n\n\`\`\`json\n${prettyJson}\n\`\`\``;
    } catch {
      return raw;
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const {
      input,
      pendingImages,
      loading,
      vendor,
      model,
      temperature,
      maxTokens,
      contextWindow,
      enableThinking,
      thinkingBudget,
      useMcpTools,
      currentSessionId,
      messages,
    } = stateRef.current;
    const imageSnapshot = [...pendingImages];
    const inputVal = input;
    const canSendNow = Boolean(inputVal.trim()) || imageSnapshot.length > 0;
    if (!canSendNow || loading) return;

    const apiMessageText = inputVal.trim() || t('chat.imageDefaultPrompt');
    const displayUserText = inputVal.trim() || (imageSnapshot.length > 0 ? t('chat.imageOnlyLabel') : '');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayUserText,
      timestamp: Date.now(),
      displayContent: '',
      images: imageSnapshot.length > 0 ? imageSnapshot.map(({ mimeType, previewUrl }) => ({ mimeType, previewUrl })) : undefined,
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      displayContent: '',
      thinkingContent: '',
      thinkingStatus: 'idle',
      answerStatus: 'idle',
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage, assistantMessage];
    let finalMessagesOverride: Message[] | null = null;
    dispatch({ type: 'SET_MESSAGES', payload: newMessages });
    dispatch({ type: 'SET_INPUT', payload: '' });
    dispatch({ type: 'SET_PENDING_IMAGES', payload: [] });
    dispatch({ type: 'SET_LOADING', payload: true });

    stopTypeWriter();
    abortControllerRef.current = new AbortController();
    streamCompletedRef.current = false;
    activeAssistantIdRef.current = assistantMessageId;

    // Update session with new messages
    const sid = currentSessionId;
    if (sid) {
      const session = stateRef.current.sessions.find((s) => s.id === sid);
      if (session) {
        const firstUser = newMessages.find((m) => m.role === 'user');
        const titleBase = firstUser?.content?.trim() || (firstUser?.images?.length ? t('chat.imageOnlyLabel') : '') || '新对话';
        const title = newMessages.length > 1 ? `${titleBase.slice(0, 30)}...` : '新对话';
        dispatch({
          type: 'UPDATE_SESSION',
          payload: { id: sid, updates: { messages: newMessages, title, timestamp: Date.now() } },
        });
      }
    }

    try {
      const response = await requestAIChatStream({
        message: apiMessageText,
        currentDate: new Date().toISOString(),
        sessionId: currentSessionId || undefined,
        images: imageSnapshot.length > 0 ? imageSnapshot.map(({ mimeType, dataBase64 }) => ({ mimeType, dataBase64 })) : undefined,
        provider: vendor,
        model,
        temperature,
        maxTokens,
        contextWindow,
        thinkingEnabled: enableThinking,
        thinkingBudget,
        useMcpTools,
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error('流式响应为空');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffered = '';
      const streamRuntime = { accumulatedText: '', accumulatedThinking: '', detectedIntent: null as IntentName | null };

      // Create a React-style state setter that handles SetStateAction
      // Note: We use UPDATE_MESSAGES_BATCH to pass the function directly to the reducer,
      // so React calls it with the correct current state even when updates are batched
      const setMessagesStyle = (msgsOrFn: Message[] | ((prev: Message[]) => Message[])) => {
        if (typeof msgsOrFn === 'function') {
          dispatch({ type: 'UPDATE_MESSAGES_BATCH', payload: msgsOrFn });
        } else {
          dispatch({ type: 'SET_MESSAGES', payload: msgsOrFn });
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        const chunks = buffered.split('\n\n');
        buffered = chunks.pop() || '';
        for (const chunk of chunks) {
          const streamEvent = parseSSEChunk(chunk);
          if (!streamEvent) continue;
          handleChatStreamEvent({
            streamEvent,
            assistantMessageId,
            runtime: streamRuntime,
            setMessages: setMessagesStyle,
            pendingTypeTextRef,
            streamCompletedRef,
            runTypeWriter,
            stopTypeWriter,
            formatAiStreamErrorPayload,
          });
        }
      }
    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') {
        stopTypeWriter();
        const stopUpdates = {
          content: (stateRef.current.messages.find(m => m.id === assistantMessageId)?.content || '') + '\n\n[已停止生成]',
          displayContent: (stateRef.current.messages.find(m => m.id === assistantMessageId)?.displayContent || '') + '\n\n[已停止生成]',
          isComplete: true,
          thinkingStatus: 'done' as const,
          answerStatus: 'done' as const,
          webSearchStatus: 'done' as const,
        };
        const stopMessages = stateRef.current.messages.map((m) =>
          m.id === assistantMessageId ? { ...m, ...stopUpdates } : m
        );
        finalMessagesOverride = stopMessages;
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            id: assistantMessageId,
            updates: stopUpdates,
          },
        });
        message.info('已停止生成');
        return;
      }
      console.error('AI response error:', error);
      const errorMsg = (error as Error).message || t('chat.streamErrorFallback');
      message.error(errorMsg);
      stopTypeWriter();
      const errorReasonForDisplay = formatErrorReasonForDisplay(errorMsg);
      const errorUpdates = {
        content: t('chat.requestFailedWithReason', { reason: errorReasonForDisplay }),
        displayContent: t('chat.requestFailedWithReason', { reason: errorReasonForDisplay }),
        isComplete: true,
        thinkingStatus: 'done' as const,
        answerStatus: 'done' as const,
        webSearchStatus: 'done' as const,
      };
      const errorMessages = stateRef.current.messages.map((m) =>
        m.id === assistantMessageId ? { ...m, ...errorUpdates } : m
      );
      finalMessagesOverride = errorMessages;
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          id: assistantMessageId,
          updates: errorUpdates,
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      abortControllerRef.current = null;
      // Update the session with the latest messages from stateRef
      // This ensures the session is saved with all stream updates (card, isComplete, etc.)
      const currentSid = stateRef.current.currentSessionId;
      const finalMessages = finalMessagesOverride ?? stateRef.current.messages;
      const updatedSessions = stateRef.current.sessions.map((s) => {
        // Update the session where message was sent
        if (s.id === sid) {
          return { ...s, messages: finalMessages, timestamp: Date.now() };
        }
        // Also update current session if different from sid
        if (s.id === currentSid && currentSid !== sid) {
          return { ...s, messages: finalMessages, timestamp: Date.now() };
        }
        return s;
      });
      saveSessions(updatedSessions);
    }
  }, [t, stopTypeWriter, runTypeWriter, formatAiStreamErrorPayload, formatErrorReasonForDisplay, saveSessions]);

  const stopGeneration = useCallback(() => {
    stopTypeWriter();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [stopTypeWriter]);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制');
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    const { currentSessionId, messages } = stateRef.current;
    if (!currentSessionId) return;
    const nextMessages = messages.filter((m) => m.id !== messageId);
    dispatch({ type: 'SET_MESSAGES', payload: nextMessages });
    const updatedSessions = stateRef.current.sessions.map((s) =>
      s.id === currentSessionId
        ? { ...s, messages: nextMessages, timestamp: Date.now() }
        : s
    );
    saveSessions(updatedSessions);
  }, [saveSessions]);

  const regenerateMessage = useCallback(async (assistantMessageId: string) => {
    if (stateRef.current.loading) return;
    const { currentSessionId, messages } = stateRef.current;
    if (!currentSessionId || messages.length === 0) return;

    const latestAssistantIndex = [...messages]
      .map((m, idx) => ({ m, idx }))
      .filter(({ m }) => m.role === 'assistant')
      .at(-1)?.idx;

    const targetIndex = messages.findIndex(
      (m) => m.id === assistantMessageId && m.role === 'assistant'
    );

    if (targetIndex < 0 || latestAssistantIndex !== targetIndex) {
      message.info('暂仅支持重新生成最后一条助手消息');
      return;
    }

    let userIndex = -1;
    for (let i = targetIndex - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') {
        userIndex = i;
        break;
      }
    }
    if (userIndex < 0) {
      message.warning('未找到可重试的用户消息');
      return;
    }

    const userMessage = messages[userIndex];
    const baseMessages = messages.slice(0, userIndex);
    dispatch({ type: 'SET_MESSAGES', payload: baseMessages });
    dispatch({ type: 'SET_INPUT', payload: userMessage.content || '' });
    dispatch({ type: 'SET_PENDING_IMAGES', payload: [] });

    const updatedSessions = stateRef.current.sessions.map((s) =>
      s.id === currentSessionId
        ? { ...s, messages: baseMessages, timestamp: Date.now() }
        : s
    );
    saveSessions(updatedSessions);

    stateRef.current = {
      ...stateRef.current,
      messages: baseMessages,
      input: userMessage.content || '',
      pendingImages: [],
      sessions: updatedSessions,
    };

    await sendMessage();
  }, [saveSessions, sendMessage]);

  const handleSaveSettings = useCallback(async () => {
    const { vendor, model, temperature, maxTokens, contextWindow, enableThinking, thinkingBudget, useMcpTools, apiKeys } = stateRef.current;
    try {
      await saveAIConfig({
        provider: vendor,
        model,
        temperature,
        maxTokens,
        contextWindow,
        thinkingEnabled: enableThinking,
        thinkingBudget,
        useMcpTools,
        apiKeys,
      });
      dispatch({
        type: 'SET_HAS_API_KEY_BY_PROVIDER',
        payload: { ...stateRef.current.hasApiKeyByProvider, [vendor]: Boolean((apiKeys[vendor] || '').trim()) },
      });
      message.success('AI 配置已保存');
    } catch (error) {
      message.error((error as Error).message || '保存配置失败');
    }
  }, []);

  // Load remote config
  useEffect(() => {
    const loadRemoteConfig = async () => {
      try {
        const result = await getAIConfig();
        const data = (result?.data || result);
        if (data.provider && isVendorType(data.provider)) {
          dispatch({ type: 'SET_VENDOR', payload: data.provider });
        }
        if (data.model) dispatch({ type: 'SET_MODEL', payload: data.model });
        if (typeof data.temperature === 'number') dispatch({ type: 'SET_TEMPERATURE', payload: data.temperature });
        if (typeof data.maxTokens === 'number') dispatch({ type: 'SET_MAX_TOKENS', payload: data.maxTokens });
        if (typeof data.contextWindow === 'number') dispatch({ type: 'SET_CONTEXT_WINDOW', payload: data.contextWindow });
        if (typeof data.thinkingEnabled === 'boolean') dispatch({ type: 'SET_ENABLE_THINKING', payload: data.thinkingEnabled });
        if (typeof data.thinkingBudget === 'number') dispatch({ type: 'SET_THINKING_BUDGET', payload: data.thinkingBudget });
        if (typeof data.useMcpTools === 'boolean') dispatch({ type: 'SET_USE_MCP_TOOLS', payload: data.useMcpTools });
        if (data.hasApiKeyByProvider && typeof data.hasApiKeyByProvider === 'object') {
          dispatch({ type: 'SET_HAS_API_KEY_BY_PROVIDER', payload: data.hasApiKeyByProvider });
        }
      } catch( error) {
        console.error('loadRemoteConfig error', error)
      }
    };
    loadRemoteConfig();
  }, []);

  // Scroll to bottom on messages change
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
  }, [state.messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typeWriterTimerRef.current) {
        clearTimeout(typeWriterTimerRef.current);
      }
    };
  }, []);

  const value = useMemo<ChatContextValue>(() => ({
    state,
    dispatch,
    persistCurrentChatToStorage,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage,
    stopGeneration,
    handleCopy,
    deleteMessage,
    regenerateMessage,
    handleSaveSettings,
    messagesEndRef,
    fileInputRef,
    theme,
    isDark,
  }), [
    state,
    dispatch,
    persistCurrentChatToStorage,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage,
    stopGeneration,
    handleCopy,
    deleteMessage,
    regenerateMessage,
    handleSaveSettings,
    theme,
    isDark,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
