import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Button,
  Card,
  message,
  Popover,
} from 'antd';
import {
  RobotOutlined,
  SettingOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { requestAIChatStream, saveAIConfig, getAIConfig } from '@services/ai';
import './index.less';
import { isMobile } from '@/utils/device';
import {
  CHAT_MAX_IMAGES,
  readFileAsChatImage,
  revokeChatImagePreview,
  type ChatImagePayload,
} from './utils/chat-images';
import ChatInput from './components/ChatInput';
import ChatHistoryDrawer from './components/ChatHistoryDrawer';
import ChatMessageList from './components/ChatMessageList';
import ChatSettingsPanel from './components/ChatSettingsPanel';
import ChatSidebar from './components/ChatSidebar';
import {
  MODEL_VENDORS,
  MAX_SESSIONS,
  STORAGE_KEY,
  isChatImageSupportedVendor,
  isVendorType,
  sessionsForLocalStorage,
} from './constants';
import { parseSSEChunk } from './stream-utils';
import { handleChatStreamEvent } from './stream-event-handler';
import {
  VendorType,
  type ChatSession,
  type IntentName,
  type Message,
} from './types';

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [pendingImages, setPendingImages] = useState<ChatImagePayload[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // 配置项
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [hasApiKeyByProvider, setHasApiKeyByProvider] = useState<
    Record<string, boolean>
  >({});
  const [vendor, setVendor] = useState<VendorType>(VendorType.MINIMAX);
  const [model, setModel] = useState('MiniMax-M2.5');
  const [temperature, setTemperature] = useState(7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [contextWindow, setContextWindow] = useState(10);
  const [thinkingBudget, setThinkingBudget] = useState(0);
  const [enableThinking, setEnableThinking] = useState(true);
  const [expandedThinkingMessageIds, setExpandedThinkingMessageIds] = useState<
    Set<string>
  >(new Set());
  const { theme } = useSelector((state: RootState) => state.theme);
  const userAvatar = useSelector((state: RootState) => state.auth.user?.avatar);
  const isDark = useMemo(() => {
    return (
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<ChatImagePayload[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typeWriterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTypeTextRef = useRef('');
  const streamCompletedRef = useRef(false);
  const activeAssistantIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const sessionsRef = useRef<ChatSession[]>([]);
  const currentSessionIdRef = useRef<string | null>(null);
  const inputRef = useRef('');
  const loadingRef = useRef(false);

  pendingImagesRef.current = pendingImages;
  messagesRef.current = messages;
  sessionsRef.current = sessions;
  currentSessionIdRef.current = currentSessionId;
  inputRef.current = input;
  loadingRef.current = loading;

  // 清理打字机定时器
  useEffect(() => {
    return () => {
      if (typeWriterTimerRef.current) {
        clearTimeout(typeWriterTimerRef.current);
        typeWriterTimerRef.current = null;
      }
      pendingTypeTextRef.current = '';
      streamCompletedRef.current = false;
      activeAssistantIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach(revokeChatImagePreview);
    };
  }, []);

  const formatAiStreamErrorPayload = useCallback(
    (payload: Record<string, unknown> | undefined): string => {
      const code =
        typeof payload?.errorCode === 'string' ? payload.errorCode : '';
      const fallback =
        typeof payload?.error === 'string' ? payload.error : '';
      if (code) {
        return t(`chat.errors.${code}`, {
          defaultValue: fallback || t('chat.streamErrorFallback'),
        });
      }
      return fallback || t('chat.streamErrorFallback');
    },
    [t],
  );

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
        if (
          streamCompletedRef.current &&
          activeAssistantIdRef.current === assistantMessageId
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, isComplete: true }
                : msg,
            ),
          );
          streamCompletedRef.current = false;
        }
        return;
      }

      const chunk = pendingTypeTextRef.current.slice(0, 2);
      pendingTypeTextRef.current = pendingTypeTextRef.current.slice(2);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, displayContent: (msg.displayContent || '') + chunk }
            : msg,
        ),
      );

      typeWriterTimerRef.current = setTimeout(tick, 16);
    };

    typeWriterTimerRef.current = setTimeout(tick, 0);
  }, []);

  const toggleThinkingExpanded = useCallback((messageId: string) => {
    setExpandedThinkingMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  // 创建新会话（内部方法）
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
      model: model,
    };

    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessionsForLocalStorage([newSession])),
    );
  }, [model, t]);

  // 加载历史记录
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setMessages(
            (parsed[0].messages || []).map((m: Message) => ({
              ...m,
              displayContent: m.content,
              isComplete: true,
            })),
          );
        } else {
          // 没有会话，创建新会话
          createNewSessionInternal();
        }
      } catch (e) {
        console.error('Failed to load sessions:', e);
        createNewSessionInternal();
      }
    } else {
      createNewSessionInternal();
    }
  }, [createNewSessionInternal]);

  // 保存会话到 localStorage
  const saveSessions = useCallback((newSessions: ChatSession[]) => {
    const limitedSessions = newSessions.slice(0, MAX_SESSIONS);
    setSessions(limitedSessions);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sessionsForLocalStorage(limitedSessions)),
    );
  }, []);

  useEffect(() => {
    const loadRemoteConfig = async () => {
      try {
        const result = await getAIConfig();
        const data = (result?.data || result) as {
          provider?: string;
          model?: string;
          temperature?: number;
          maxTokens?: number;
          contextWindow?: number;
          thinkingEnabled?: boolean;
          thinkingBudget?: number;
          hasApiKeyByProvider?: Record<string, boolean>;
        };
        if (data.provider && isVendorType(data.provider)) {
          setVendor(data.provider);
        }
        if (data.model) setModel(data.model);
        if (typeof data.temperature === 'number') setTemperature(data.temperature);
        if (typeof data.maxTokens === 'number') setMaxTokens(data.maxTokens);
        if (typeof data.contextWindow === 'number') setContextWindow(data.contextWindow);
        if (typeof data.thinkingEnabled === 'boolean') setEnableThinking(data.thinkingEnabled);
        if (typeof data.thinkingBudget === 'number') setThinkingBudget(data.thinkingBudget);
        if (
          data.hasApiKeyByProvider &&
          typeof data.hasApiKeyByProvider === 'object'
        ) {
          setHasApiKeyByProvider(
            data.hasApiKeyByProvider as Record<string, boolean>,
          );
        }
      } catch {
        // ignore
      }
    };
    loadRemoteConfig();
  }, []);

  const addFilesToPending = useCallback(
    async (files: File[]) => {
      if (!isChatImageSupportedVendor(vendor)) {
        message.warning(t('chat.imageNotSupportedForProvider'));
        return;
      }
      for (const file of files) {
        try {
          const img = await readFileAsChatImage(file);
          setPendingImages((prev) => {
            if (prev.length >= CHAT_MAX_IMAGES) {
              message.warning(t('chat.maxImages'));
              return prev;
            }
            return [...prev, img];
          });
        } catch (err) {
          const code = err instanceof Error ? err.message : '';
          if (code === 'too_large') {
            message.warning(t('chat.imageTooLarge'));
          } else {
            message.warning(t('chat.invalidImageType'));
          }
        }
      }
    },
    [t, vendor],
  );

  const removePendingImage = useCallback((id: string) => {
    setPendingImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) revokeChatImagePreview(item);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const onChatFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      e.target.value = '';
      if (!list?.length) return;
      await addFilesToPending(Array.from(list));
    },
    [addFilesToPending],
  );

  const onChatPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith('image/'),
      );
      if (!files.length) return;
      if (!isChatImageSupportedVendor(vendor)) {
        e.preventDefault();
        message.warning(t('chat.pasteImageNotSupported'));
        return;
      }
      e.preventDefault();
      await addFilesToPending(files);
    },
    [addFilesToPending, vendor, t],
  );

  // 合并到 requestAnimationFrame：messages 高频更新（流式/打字机）时避免同步多次 scrollIntoView 触发布局抖动
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(id);
  }, [messages]);

  // 厂商变化时更新模型选项
  useEffect(() => {
    const currentVendor = MODEL_VENDORS.find((v) => v.value === vendor);
    if (currentVendor && currentVendor.models.length > 0) {
      setModel(currentVendor.models[0].value);
    }
  }, [vendor]);

  // 创建新会话（供按钮调用）
  const createNewSession = useCallback(() => {
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
      model: model,
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev];
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(sessionsForLocalStorage(updated)),
      );
      return updated;
    });
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
  }, [model, t]);

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    const session = sessionsRef.current.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages || []);
    }
  }, []);

  // 删除会话
  const deleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      const newSessions = sessionsRef.current.filter((s) => s.id !== sessionId);
      saveSessions(newSessions);

      if (currentSessionIdRef.current === sessionId) {
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id);
          setMessages(newSessions[0].messages);
        } else {
          createNewSession();
        }
      }
    },
    [saveSessions, createNewSession],
  );

  // 更新当前会话消息
  const updateCurrentSession = useCallback(
    (newMessages: Message[]) => {
      setMessages(newMessages);

      const sid = currentSessionIdRef.current;
      if (!sid) return;

      const session = sessionsRef.current.find((s) => s.id === sid);
      if (!session) return;

      const firstUser = newMessages.find((m) => m.role === 'user');
      const titleBase =
        firstUser?.content?.trim() ||
        (firstUser?.images?.length ? t('chat.imageOnlyLabel') : '') ||
        '新对话';
      const title =
        newMessages.length > 1 ? `${titleBase.slice(0, 30)}...` : '新对话';

      const newSessions = sessionsRef.current.map((s) =>
        s.id === sid
          ? { ...s, messages: newMessages, title, timestamp: Date.now() }
          : s,
      );
      const current = newSessions.find((s) => s.id === sid);
      const others = newSessions.filter((s) => s.id !== sid);
      if (current) {
        saveSessions([current, ...others]);
      }
    },
    [t, saveSessions],
  );

  // 流式发送消息（用 ref 读最新 state，避免 handleSend 随 messages/input 变化而重建，减轻输入框与列表的重渲染）
  const handleSend = useCallback(async () => {
    const imageSnapshot = [...pendingImagesRef.current];
    const inputVal = inputRef.current;
    const canSendNow =
      Boolean(inputVal.trim()) || imageSnapshot.length > 0;
    if (!canSendNow || loadingRef.current) return;

    const apiMessageText =
      inputVal.trim() || t('chat.imageDefaultPrompt');
    const displayUserText =
      inputVal.trim() ||
      (imageSnapshot.length > 0 ? t('chat.imageOnlyLabel') : '');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: displayUserText,
      timestamp: Date.now(),
      displayContent: '',
      images:
        imageSnapshot.length > 0
          ? imageSnapshot.map(({ mimeType, previewUrl }) => ({
              mimeType,
              previewUrl,
            }))
          : undefined,
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

    const currentMessages = messagesRef.current || [];
    const newMessages = [...currentMessages, userMessage, assistantMessage];
    updateCurrentSession(newMessages);
    setInput('');
    setPendingImages([]);
    setLoading(true);

    stopTypeWriter();

    abortControllerRef.current = new AbortController();
    streamCompletedRef.current = false;
    activeAssistantIdRef.current = assistantMessageId;

    try {
      const response = await requestAIChatStream({
        message: apiMessageText,
        currentDate: new Date().toISOString(),
        sessionId: currentSessionIdRef.current || undefined,
        images:
          imageSnapshot.length > 0
            ? imageSnapshot.map(({ mimeType, dataBase64 }) => ({
                mimeType,
                dataBase64,
              }))
            : undefined,
        provider: vendor,
        model,
        temperature,
        maxTokens,
        contextWindow,
        thinkingEnabled: enableThinking,
        thinkingBudget,
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) {
        throw new Error('流式响应为空');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffered = '';
      const streamRuntime: {
        accumulatedText: string;
        accumulatedThinking: string;
        detectedIntent: IntentName | null;
      } = {
        accumulatedText: '',
        accumulatedThinking: '',
        detectedIntent: null,
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
            setMessages,
            pendingTypeTextRef,
            streamCompletedRef,
            runTypeWriter,
            stopTypeWriter,
            formatAiStreamErrorPayload,
          });
        }
      }

      const finalChunk = parseSSEChunk(buffered.trim());
      if (finalChunk?.event === 'error') {
        throw new Error(
          formatAiStreamErrorPayload(
            finalChunk.payload as Record<string, unknown> | undefined,
          ),
        );
      }
    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') {
        stopTypeWriter();
        setMessages((prev) =>
          prev.map((msg: Message) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: msg.content + '\n\n[已停止生成]',
                  displayContent: msg.content + '\n\n[已停止生成]',
                  isComplete: true,
                  thinkingStatus: 'done',
                  answerStatus: 'done',
                  webSearchStatus: 'done',
                }
              : msg,
          ),
        );
        message.info('已停止生成');
        return;
      }

      console.error('AI response error:', error);
      const errorMsg =
        (error as Error).message || t('chat.streamErrorFallback');
      message.error(errorMsg);

      stopTypeWriter();
      const failLine = t('chat.requestFailedWithReason', { reason: errorMsg });
      setMessages((prev) =>
        prev.map((msg: Message) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: failLine,
                displayContent: failLine,
                isComplete: true,
                thinkingStatus: 'done',
                answerStatus: 'done',
                webSearchStatus: 'done',
              }
            : msg,
        ),
      );
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      // 保存最终消息到 localStorage（用 ref 避免闭包拿到过期的 sessions / currentSessionId）
      setMessages((currentMessages) => {
        const sid = currentSessionIdRef.current;
        if (sid) {
          const newSessions = sessionsRef.current.map((s) =>
            s.id === sid
              ? { ...s, messages: currentMessages, timestamp: Date.now() }
              : s,
          );
          const current = newSessions.find((s) => s.id === sid);
          const others = newSessions.filter((s) => s.id !== sid);
          if (current) {
            const updatedSessions = [current, ...others];
            setSessions(updatedSessions);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(sessionsForLocalStorage(updatedSessions)),
            );
          }
        }
        return currentMessages;
      });
    }
  }, [
    updateCurrentSession,
    t,
    vendor,
    model,
    temperature,
    maxTokens,
    contextWindow,
    enableThinking,
    thinkingBudget,
    stopTypeWriter,
    formatAiStreamErrorPayload,
    runTypeWriter,
  ]);

  const handleStop = useCallback(() => {
    stopTypeWriter();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [stopTypeWriter]);

  const handleCopy = useCallback((content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    message.success('已复制');
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleSaveSettings = useCallback(async () => {
    try {
      await saveAIConfig({
        provider: vendor,
        model,
        temperature,
        maxTokens,
        contextWindow,
        thinkingEnabled: enableThinking,
        thinkingBudget,
        apiKeys,
      });
      setHasApiKeyByProvider((prev) => ({
        ...prev,
        [vendor]: Boolean((apiKeys[vendor] || '').trim()),
      }));
      message.success('AI 配置已保存');
    } catch (error) {
      message.error((error as Error).message || '保存配置失败');
    }
  }, [
    vendor,
    model,
    temperature,
    maxTokens,
    contextWindow,
    enableThinking,
    thinkingBudget,
    apiKeys,
  ]);

  const handleInputFocus = useCallback(() => setInputFocused(true), []);
  const handleInputBlur = useCallback(() => setInputFocused(false), []);

  const handleToggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((c) => !c);
  }, []);

  const handleMobileDrawerClose = useCallback(() => {
    setMobileDrawerOpen(false);
  }, []);

  const handleMobileDrawerOpen = useCallback(() => {
    setMobileDrawerOpen(true);
  }, []);

  const handleDrawerCreateSession = useCallback(() => {
    createNewSession();
    setMobileDrawerOpen(false);
  }, [createNewSession]);

  const handleDrawerSwitchSession = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      setMobileDrawerOpen(false);
    },
    [switchSession],
  );

  const settingsContent = useMemo(
    () => (
      <ChatSettingsPanel
        apiKeys={apiKeys}
        vendor={vendor}
        model={model}
        temperature={temperature}
        maxTokens={maxTokens}
        contextWindow={contextWindow}
        enableThinking={enableThinking}
        thinkingBudget={thinkingBudget}
        hasApiKeyByProvider={hasApiKeyByProvider}
        onApiKeysChange={setApiKeys}
        onVendorChange={setVendor}
        onModelChange={setModel}
        onTemperatureChange={setTemperature}
        onMaxTokensChange={setMaxTokens}
        onContextWindowChange={setContextWindow}
        onEnableThinkingChange={setEnableThinking}
        onThinkingBudgetChange={setThinkingBudget}
        onSave={handleSaveSettings}
        apiKeyConfiguredText={t('chat.apiKeyConfigured', {
          defaultValue: '当前厂商已配置密钥（服务器端加密存储）',
        })}
        apiKeyNotConfiguredText={t('chat.apiKeyNotConfigured', {
          defaultValue: '当前厂商未配置密钥',
        })}
      />
    ),
    [
      apiKeys,
      vendor,
      model,
      temperature,
      maxTokens,
      contextWindow,
      enableThinking,
      thinkingBudget,
      hasApiKeyByProvider,
      handleSaveSettings,
      t,
    ],
  );

  return (
    <div className={`chat-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ChatSidebar
        sidebarCollapsed={sidebarCollapsed}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onToggleCollapsed={handleToggleSidebarCollapsed}
        onCreateSession={createNewSession}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
      />

      <Card className="chat-container">
        <div className="chat-header">
          {/* 移动端历史抽屉按钮 */}
          <div className="header-left">
            {isMobile() && (
              <Button
                type="text"
                className="menu-btn"
                icon={<MenuOutlined />}
                onClick={handleMobileDrawerOpen}
              />
            )}
          </div>
          <div className="chat-title">
            <div className="title-icon">
              <RobotOutlined />
            </div>
            <div className="title-text">
              <span className="title-main">AI 聊天</span>
              <span className="title-sub">{model}</span>
            </div>
          </div>
          <div className="header-actions">
            <Popover
              content={settingsContent}
              trigger="click"
              placement="bottomRight"
              overlayClassName="settings-popover"
              open={showSettings}
              onOpenChange={setShowSettings}
            >
              <Button
                type="link"
                icon={<SettingOutlined />}
                className={`header-btn ${showSettings ? 'active' : ''}`}
              >
                <span className="btn-text">设置</span>
              </Button>
            </Popover>
            {/* 移动端关闭按钮 */}
            {isMobile() && (
              <Button
                type="text"
                className="close-btn"
                icon={<CloseOutlined />}
                onClick={() => window.history.back()}
              />
            )}
          </div>
        </div>

        <ChatMessageList
          messages={messages}
          loading={loading}
          userAvatar={userAvatar || undefined}
          isDark={isDark}
          expandedThinkingMessageIds={expandedThinkingMessageIds}
          onToggleThinkingExpanded={toggleThinkingExpanded}
          onCopyMessage={handleCopy}
          messagesEndRef={messagesEndRef}
          thinkingProcessLabel={t('chat.thinkingProcess')}
          webSearchRetrievingLabel={t('chat.webSearchRetrieving')}
          expandThinkingAriaLabel="expand thinking"
          collapseThinkingAriaLabel="collapse thinking"
          copyLabel="复制"
        />

        {isChatImageSupportedVendor(vendor) && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            multiple
            className="chat-file-input-hidden"
            onChange={onChatFileInputChange}
            aria-hidden
          />
        )}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyPress}
          onPaste={onChatPaste}
          loading={loading}
          inputFocused={inputFocused}
          canSend={Boolean(input.trim()) || pendingImages.length > 0}
          attachments={pendingImages}
          onRemoveAttachment={removePendingImage}
          onPickImage={() => fileInputRef.current?.click()}
          attachLabel={t('chat.attachImage')}
          pasteHint={t('chat.pasteImageHint')}
          placeholder={
            isChatImageSupportedVendor(vendor)
              ? t('chat.sendPlaceholder')
              : t('chat.sendPlaceholderTextOnly')
          }
          sendShortcutHint={t('chat.sendShortcut')}
          stopLabel={t('chat.stop')}
          sendLabel={t('chat.send')}
          imageUploadSupported={isChatImageSupportedVendor(vendor)}
        />
      </Card>

      <ChatHistoryDrawer
        open={mobileDrawerOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onClose={handleMobileDrawerClose}
        onCreateSession={handleDrawerCreateSession}
        onSwitchSession={handleDrawerSwitchSession}
        onDeleteSession={deleteSession}
      />
    </div>
  );
};

export default ChatPage;
