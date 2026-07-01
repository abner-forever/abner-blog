import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useChat } from './context/ChatContext';
import { useChatMessages } from './context/ChatMessagesContext';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import ChatMessageList from './components/ChatMessageList';
import ChatHistoryDrawer from './components/ChatHistoryDrawer';
import ChatSettingsModal from './components/ChatSettingsModal';
import KnowledgeBasePanel from './components/KnowledgeBasePanel';
import MCPServerPanel from './components/MCPServerPanel';
import SkillPanel from './components/SkillPanel';
import AnimatedPanel from './components/AnimatedPanel';
import WelcomeScreen from './components/WelcomeScreen';
import { MODEL_VENDORS, isChatImageSupportedVendor } from './constants';
import { readFileAsChatImage, revokeChatImagePreview, CHAT_MAX_IMAGES, type ChatImagePayload } from './utils/chat-images';
import { useAppSelector } from '@/store/reduxHooks';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { message } from 'antd';
import './index.less';

const ChatPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const { checkAuth } = useAuthCheck();

  // 低变更上下文：会话、配置、主题
  const {
    state,
    dispatch,
    createNewSession,
    switchSession,
    deleteSession,
    isDark,
  } = useChat();

  // 高变更上下文：消息、流式交互
  const {
    messages,
    loading,
    input,
    pendingImages,
    inputFocused,
    expandedThinkingMessageIds,
    messagesEndRef,
    fileInputRef,
    sendMessage,
    stopGeneration,
    handleCopy,
    regenerateMessage,
    onToggleThinkingExpanded,
  } = useChatMessages();

  const {
    sessionsLoaded,
    vendor,
    enableThinking,
    enableWebSearch,
    sidebarCollapsed,
    mobileDrawerOpen,
    sessions,
    currentSessionId,
    showChatSettings,
    showKnowledgeBase,
    showMCPServer,
    showSkill,
    hasApiKeyByProvider,
  } = state;

  // Add files to pending
  const addFilesToPending = useCallback(
    async (files: File[]) => {
      if (!isChatImageSupportedVendor(vendor)) {
        message.warning(t('chat.imageNotSupportedForProvider'));
        return;
      }
      for (const file of files) {
        try {
          const img = await readFileAsChatImage(file);
          dispatch({
            type: 'SET_PENDING_IMAGES',
            payload: pendingImages.length >= CHAT_MAX_IMAGES ? pendingImages : [...pendingImages, img],
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
    [dispatch, pendingImages, t, vendor]
  );

  const removePendingImage = useCallback(
    (id: string) => {
      const item = pendingImages.find((i: ChatImagePayload) => i.id === id);
      if (item) revokeChatImagePreview(item);
      dispatch({
        type: 'SET_PENDING_IMAGES',
        payload: pendingImages.filter((i: ChatImagePayload) => i.id !== id),
      });
    },
    [dispatch, pendingImages]
  );

  const handleChatFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      e.target.value = '';
      if (!list?.length) return;
      await addFilesToPending(Array.from(list));
    },
    [addFilesToPending]
  );

  const handleChatPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const files = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      if (!isChatImageSupportedVendor(vendor)) {
        e.preventDefault();
        message.warning(t('chat.pasteImageNotSupported'));
        return;
      }
      e.preventDefault();
      await addFilesToPending(files);
    },
    [addFilesToPending, vendor, t]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage]
  );

  const handleMobileDrawerClose = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_DRAWER_OPEN', payload: false });
  }, [dispatch]);

  const handleDrawerCreateSession = useCallback(() => {
    createNewSession();
    handleMobileDrawerClose();
  }, [createNewSession, handleMobileDrawerClose]);

  const handleDrawerSwitchSession = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      handleMobileDrawerClose();
    },
    [switchSession, handleMobileDrawerClose]
  );

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      deleteSession(sessionId);
    },
    [deleteSession]
  );

  const handleCloseSettings = useCallback(() => {
    dispatch({ type: 'SET_SHOW_CHAT_SETTINGS', payload: false });
  }, [dispatch]);

  const handleCloseKnowledgeBase = useCallback(() => {
    dispatch({ type: 'SET_SHOW_KNOWLEDGE_BASE', payload: false });
  }, [dispatch]);

  const handleCloseMCPServer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_MCP_SERVER', payload: false });
  }, [dispatch]);

  const handleCloseSkill = useCallback(() => {
    dispatch({ type: 'SET_SHOW_SKILL', payload: false });
  }, [dispatch]);

  const handleSuggestionClick = useCallback(
    (text: string) => {
      dispatch({ type: 'SET_INPUT', payload: text });
    },
    [dispatch]
  );

  const handleToggleThinking = useCallback(() => {
    dispatch({ type: 'SET_ENABLE_THINKING', payload: !enableThinking });
  }, [dispatch, enableThinking]);

  const handleToggleWebSearch = useCallback(() => {
    dispatch({ type: 'SET_ENABLE_WEB_SEARCH', payload: !enableWebSearch });
  }, [dispatch, enableWebSearch]);

  const handleModelChange = useCallback(
    (value: string) => {
      const selectedModel = MODEL_VENDORS.flatMap((v) => v.models).find((m) => m.value === value);
      if (selectedModel) {
        const selectedVendor = MODEL_VENDORS.find((v) =>
          v.models.some((m) => m.value === value),
        );
        if (selectedVendor) {
          dispatch({ type: 'SET_VENDOR', payload: selectedVendor.value });
        }
        dispatch({ type: 'SET_MODEL', payload: value });
      }
    },
    [dispatch],
  );

  // Cleanup pending images on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach(revokeChatImagePreview);
    };
  }, []);

  return (
    <div className={`chat-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <ChatSidebar />

      <div className="chat-main">
        <ChatHeader />

        {isChatImageSupportedVendor(vendor) && (
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            multiple
            className="chat-file-input-hidden"
            onChange={handleChatFileInputChange}
            aria-hidden
          />
        )}

        {/* 游客登录提示 — 未登录时居中展示 */}
        {!isAuthenticated && (
          <div className="chat-guest-hero">
            <LoginOutlined className="chat-guest-hero__icon" />
            <h2 className="chat-guest-hero__title">
              {t('chat.loginPromptTitle', { defaultValue: '登录以开始对话' })}
            </h2>
            <p className="chat-guest-hero__desc">
              {t('chat.loginPromptDesc', {
                defaultValue: '登录后可以保存聊天记录，使用多种 AI 模型和更多功能',
              })}
            </p>
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={() => checkAuth()}
              className="chat-guest-hero__btn"
            >
              {t('nav.login')}
            </Button>
          </div>
        )}

        {isAuthenticated && !sessionsLoaded && (
          <div className="chat-loading-placeholder" />
        )}

        {isAuthenticated && sessionsLoaded && messages.length === 0 && (
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
        )}

        {isAuthenticated && messages.length > 0 && (
          <ChatMessageList
            messages={messages}
            loading={loading}
            isDark={isDark}
            expandedThinkingMessageIds={expandedThinkingMessageIds}
            onToggleThinkingExpanded={onToggleThinkingExpanded}
            onCopyMessage={handleCopy}
            onRegenerateMessage={(assistantMessageId) => { void regenerateMessage(assistantMessageId); }}
            messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
            thinkingProcessLabel={t('chat.thinkingProcess')}
            webSearchRetrievingLabel={t('chat.webSearchRetrieving')}
            expandThinkingAriaLabel="expand thinking"
            collapseThinkingAriaLabel="collapse thinking"
            copyAriaLabel="复制"
            regenerateAriaLabel="重新生成"
          />
        )}

        {isAuthenticated && (
          <ChatInput
            value={input}
            onChange={(v) => dispatch({ type: 'SET_INPUT', payload: v })}
            onSend={sendMessage}
            onStop={stopGeneration}
            onFocus={() => dispatch({ type: 'SET_INPUT_FOCUSED', payload: true })}
            onBlur={() => dispatch({ type: 'SET_INPUT_FOCUSED', payload: false })}
            onKeyDown={handleKeyPress}
            onPaste={handleChatPaste}
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
            enableThinking={enableThinking}
            onToggleThinking={handleToggleThinking}
            enableWebSearch={enableWebSearch}
            onToggleWebSearch={handleToggleWebSearch}
            deepThinkingLabel={t('chat.deepThinking', { defaultValue: '深度思考' })}
            smartSearchLabel={t('chat.smartSearch', { defaultValue: '智能搜索' })}
            model={state.model}
            onModelChange={handleModelChange}
            hasApiKeyByProvider={hasApiKeyByProvider}
          />
        )}
      </div>

      <ChatHistoryDrawer
        open={mobileDrawerOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        isAuthenticated={isAuthenticated}
        onClose={handleMobileDrawerClose}
        onCreateSession={handleDrawerCreateSession}
        onSwitchSession={handleDrawerSwitchSession}
        onDeleteSession={handleDeleteSession}
      />

      <ChatSettingsModal
        open={showChatSettings}
        onClose={handleCloseSettings}
      />

      <AnimatedPanel visible={showKnowledgeBase}>
        <KnowledgeBasePanel onClose={handleCloseKnowledgeBase} />
      </AnimatedPanel>

      <AnimatedPanel visible={showMCPServer}>
        <MCPServerPanel onClose={handleCloseMCPServer} />
      </AnimatedPanel>

      <AnimatedPanel visible={showSkill}>
        <SkillPanel onClose={handleCloseSkill} />
      </AnimatedPanel>
    </div>
  );
};

const ChatPage: React.FC = () => {
  return <ChatPageContent />;
};

export default ChatPage;
