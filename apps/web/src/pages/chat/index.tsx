import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatProvider, useChat } from './context/ChatContext';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import ChatInput from './components/ChatInput';
import ChatMessageList from './components/ChatMessageList';
import ChatHistoryDrawer from './components/ChatHistoryDrawer';
import ChatSettingsModal from './components/ChatSettingsModal';
import KnowledgeBasePanel from './components/KnowledgeBasePanel';
import MCPServerPanel from './components/MCPServerPanel';
import SkillPanel from './components/SkillPanel';
import { isChatImageSupportedVendor } from './constants';
import { readFileAsChatImage, revokeChatImagePreview, CHAT_MAX_IMAGES, type ChatImagePayload } from './utils/chat-images';
import { message } from 'antd';
import './index.less';

const ChatPageContent: React.FC = () => {
  const { t } = useTranslation();
  const {
    state,
    dispatch,
    messagesEndRef,
    fileInputRef,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage,
    stopGeneration,
    handleCopy,
    regenerateMessage,
    isDark,
  } = useChat();

  const {
    messages,
    input,
    pendingImages,
    inputFocused,
    loading,
    vendor,
    expandedThinkingMessageIds,
    sidebarCollapsed,
    mobileDrawerOpen,
    sessions,
    currentSessionId,
    showChatSettings,
    showKnowledgeBase,
    showMCPServer,
    showSkill,
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

  const toggleThinkingExpanded = useCallback(
    (messageId: string) => {
      dispatch({ type: 'TOGGLE_THINKING_EXPANDED', payload: messageId });
    },
    [dispatch]
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

        <ChatMessageList
          messages={messages}
          loading={loading}
          isDark={isDark}
          expandedThinkingMessageIds={expandedThinkingMessageIds}
          onToggleThinkingExpanded={toggleThinkingExpanded}
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
        />
      </div>

      <ChatHistoryDrawer
        open={mobileDrawerOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onClose={handleMobileDrawerClose}
        onCreateSession={handleDrawerCreateSession}
        onSwitchSession={handleDrawerSwitchSession}
        onDeleteSession={handleDeleteSession}
      />

      <ChatSettingsModal
        open={showChatSettings}
        onClose={handleCloseSettings}
      />

      {showKnowledgeBase && (
        <div className="knowledge-base-panel-wrapper">
          <KnowledgeBasePanel onClose={handleCloseKnowledgeBase} />
        </div>
      )}

      {showMCPServer && (
        <div className="knowledge-base-panel-wrapper">
          <MCPServerPanel onClose={handleCloseMCPServer} />
        </div>
      )}

      {showSkill && (
        <div className="knowledge-base-panel-wrapper">
          <SkillPanel onClose={handleCloseSkill} />
        </div>
      )}
    </div>
  );
};

const ChatPage: React.FC = () => {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
};

export default ChatPage;
