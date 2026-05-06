import React, { memo, useMemo, useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Popover,
  Modal,
  Input,
  message,
  Select,
  Spin,
} from 'antd';
import {
  ShareAltOutlined,
  SettingOutlined,
  CopyOutlined,
  CheckOutlined,
  PictureOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useChat } from '../../context/ChatContext';
import { MODEL_VENDORS } from '../../constants';
import type { ChatSession } from '../../types';
import ChatSettingsPanel from '../ChatSettingsPanel';
import ChatConversationPreview from '../ChatConversationPreview';
import { useChatShareControllerCreate } from '@services/generated/chat-share/chat-share';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import {
  copyElementImageToClipboard,
  downloadElementImageAsPng,
  logChatCopyImageFailure,
  sanitizeChatImageFilename,
} from '../../utils/export-chat-image';
import { assistantMarkdownForRender } from '../../utils/assistant-markdown';

const ChatHeader: React.FC = memo(function ChatHeader() {
  const { t } = useTranslation();
  const { state, dispatch, handleSaveSettings, isDark } = useChat();
  const { model, showSettings, sessions, currentSessionId } = state;
  const { checkAuth } = useAuthCheck();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [sharePreviewSession, setSharePreviewSession] = useState<ChatSession | null>(null);
  const [imageExporting, setImageExporting] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);
  const [exportMount, setExportMount] = useState(false);
  const imageBusy = imageExporting || imageDownloading;
  const captureOffscreenRef = useRef<HTMLDivElement>(null);

  const modelOptions = useMemo(() => {
    return MODEL_VENDORS.flatMap((v) =>
      v.models.map((m) => ({
        label: `${v.label} - ${m.label}`,
        value: m.value,
        vendor: v.value,
      })),
    );
  }, []);

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

  const { mutateAsync: createShare } = useChatShareControllerCreate();

  const previewMessages = useMemo(() => {
    if (!sharePreviewSession?.messages?.length) return [];
    return sharePreviewSession.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: assistantMarkdownForRender(m),
      timestamp: m.timestamp,
    }));
  }, [sharePreviewSession]);

  const handleShare = useCallback(async () => {
    if (!checkAuth()) return;

    if (!currentSessionId) {
      message.warning(t('chat.shareSelectSessionFirst'));
      return;
    }
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    setSharePreviewSession(session);
    setShareModalOpen(true);
    setShareUrl('');
    setCopied(false);
    setShareLoading(true);
    try {
      const result = await createShare({
        data: {
          sessionId: session.id,
          messages: session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: assistantMarkdownForRender(m),
            timestamp: m.timestamp,
          })),
          title: session.title,
        },
      });
      const shareLink = `${window.location.origin}/chat/share/${result.id}`;
      setShareUrl(shareLink);
    } catch {
      message.error(t('chat.shareCreateFailed'));
      setShareModalOpen(false);
      setSharePreviewSession(null);
    } finally {
      setShareLoading(false);
    }
  }, [currentSessionId, sessions, createShare, t, checkAuth]);

  const handleCopyShareUrl = useCallback(() => {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    message.success(t('chat.shareLinkCopied'));
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl, t]);

  const handleCloseShareModal = useCallback(() => {
    setShareModalOpen(false);
    setShareUrl('');
    setCopied(false);
    setSharePreviewSession(null);
    setExportMount(false);
  }, []);

  const handleExportImage = useCallback(async () => {
    if (previewMessages.length === 0) {
      message.warning(t('chat.shareNoMessagesToExport'));
      return;
    }
    setImageExporting(true);
    message.loading({
      content: t('chat.shareImageGenerating'),
      key: 'chat-share-img',
      duration: 0,
    });
    try {
      flushSync(() => {
        setExportMount(true);
      });
      await new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => r()));
      });
      const el = captureOffscreenRef.current;
      if (!el) {
        logChatCopyImageFailure('ChatHeader.handleExportImage', new Error('capture root missing'), {
          exportMount: true,
          previewMessageCount: previewMessages.length,
        });
        throw new Error('capture root missing');
      }
      await copyElementImageToClipboard(el);
      message.destroy('chat-share-img');
      message.success(t('chat.shareImageCopied'));
    } catch (err) {
      logChatCopyImageFailure('ChatHeader.handleExportImage', err, {
        derivedCode: err instanceof Error ? err.message : '',
        previewMessageCount: previewMessages.length,
      });
      message.destroy('chat-share-img');
      const code = err instanceof Error ? err.message : '';
      if (
        code === 'clipboard_write_unavailable' ||
        code === 'clipboard_item_unsupported'
      ) {
        message.error(t('chat.shareImageClipboardUnsupported'));
      } else if (code === 'clipboard_not_allowed') {
        message.error(t('chat.shareImageCopyNotAllowed'));
      } else {
        message.error(t('chat.shareImageFailed'));
      }
    } finally {
      setExportMount(false);
      setImageExporting(false);
    }
  }, [previewMessages.length, t]);

  const handleDownloadImageToFile = useCallback(async () => {
    if (previewMessages.length === 0) {
      message.warning(t('chat.shareNoMessagesToExport'));
      return;
    }
    setImageDownloading(true);
    message.loading({
      content: t('chat.shareImageGenerating'),
      key: 'chat-share-img-dl',
      duration: 0,
    });
    try {
      flushSync(() => {
        setExportMount(true);
      });
      await new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => r()));
      });
      const el = captureOffscreenRef.current;
      if (!el) {
        logChatCopyImageFailure(
          'ChatHeader.handleDownloadImageToFile',
          new Error('capture root missing'),
          {
            exportMount: true,
            previewMessageCount: previewMessages.length,
          },
        );
        throw new Error('capture root missing');
      }
      const sid = sharePreviewSession?.id || 'chat';
      const base = sanitizeChatImageFilename(sid);
      await downloadElementImageAsPng(el, `chat-${base}.png`);
      message.destroy('chat-share-img-dl');
      message.success(t('chat.shareImageDownloaded'));
    } catch (err) {
      logChatCopyImageFailure('ChatHeader.handleDownloadImageToFile', err, {
        derivedCode: err instanceof Error ? err.message : '',
        previewMessageCount: previewMessages.length,
      });
      message.destroy('chat-share-img-dl');
      message.error(t('chat.shareImageDownloadFailed'));
    } finally {
      setExportMount(false);
      setImageDownloading(false);
    }
  }, [previewMessages.length, sharePreviewSession?.id, t]);

  const settingsContent = useMemo(
    () => (
      <ChatSettingsPanel
        apiKeys={state.apiKeys}
        vendor={state.vendor}
        model={state.model}
        temperature={state.temperature}
        maxTokens={state.maxTokens}
        contextWindow={state.contextWindow}
        enableThinking={state.enableThinking}
        thinkingBudget={state.thinkingBudget}
        useMcpTools={state.useMcpTools}
        hasApiKeyByProvider={state.hasApiKeyByProvider}
        onApiKeysChange={(keysOrFn) => {
          const newKeys =
            typeof keysOrFn === 'function' ? keysOrFn(state.apiKeys) : keysOrFn;
          dispatch({ type: 'SET_API_KEYS', payload: newKeys });
        }}
        onVendorChange={(v) => dispatch({ type: 'SET_VENDOR', payload: v })}
        onModelChange={(m) => dispatch({ type: 'SET_MODEL', payload: m })}
        onTemperatureChange={(temp) => dispatch({ type: 'SET_TEMPERATURE', payload: temp })}
        onMaxTokensChange={(tok) => dispatch({ type: 'SET_MAX_TOKENS', payload: tok })}
        onContextWindowChange={(c) => dispatch({ type: 'SET_CONTEXT_WINDOW', payload: c })}
        onEnableThinkingChange={(e) => dispatch({ type: 'SET_ENABLE_THINKING', payload: e })}
        onThinkingBudgetChange={(b) => dispatch({ type: 'SET_THINKING_BUDGET', payload: b })}
        onUseMcpToolsChange={(u) => dispatch({ type: 'SET_USE_MCP_TOOLS', payload: u })}
        onSave={handleSaveSettings}
        apiKeyConfiguredText="当前厂商已配置密钥（服务器端加密存储）"
        apiKeyNotConfiguredText="当前厂商未配置密钥"
      />
    ),
    [state, dispatch, handleSaveSettings],
  );

  const sharePreviewTitle = sharePreviewSession?.title || t('chat.shareDefaultTitle');

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <Select
          value={model}
          onChange={handleModelChange}
          options={modelOptions}
          className="model-selector"
          popupMatchSelectWidth={false}
          placeholder={t('chat.selectModelPlaceholder')}
        />
      </div>
      <div className="chat-header-right">
        <Button
          type="text"
          icon={<ShareAltOutlined />}
          onClick={() => void handleShare()}
          className="header-btn"
        >
          <span className="btn-text">{t('chat.shareAction')}</span>
        </Button>
        <Popover
          content={settingsContent}
          trigger="click"
          placement="bottomRight"
          overlayClassName="settings-popover"
          open={showSettings}
          onOpenChange={(open) => dispatch({ type: 'SET_SHOW_SETTINGS', payload: open })}
        >
          <Button
            type="text"
            icon={<SettingOutlined />}
            className={`header-btn ${showSettings ? 'active' : ''}`}
          >
            <span className="btn-text">{t('chat.settings')}</span>
          </Button>
        </Popover>
      </div>

      <Modal
        title={t('chat.shareDialogTitle')}
        open={shareModalOpen}
        onCancel={handleCloseShareModal}
        footer={[
          <Button
            key="img"
            icon={<PictureOutlined />}
            loading={imageExporting}
            disabled={shareLoading || previewMessages.length === 0 || imageBusy}
            onClick={() => void handleExportImage()}
          >
            {t('chat.shareCopyImage')}
          </Button>,
          <Button
            key="img-dl"
            icon={<DownloadOutlined />}
            loading={imageDownloading}
            disabled={shareLoading || previewMessages.length === 0 || imageBusy}
            onClick={() => void handleDownloadImageToFile()}
          >
            {t('chat.shareDownloadImage')}
          </Button>,
          <Button
            key="copy"
            type="primary"
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={handleCopyShareUrl}
            disabled={!shareUrl}
          >
            {copied ? t('chat.shareCopiedShort') : t('chat.shareCopyLink')}
          </Button>,
        ]}
      >
        <div className="share-modal-content">
          {shareLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin tip={t('chat.shareCreatingLink')} />
            </div>
          ) : (
            <>
              <p>{t('chat.shareLinkHint')}</p>
              <Input value={shareUrl} readOnly className="share-url-input" />
            </>
          )}
        </div>
      </Modal>

      {exportMount && shareModalOpen ? (
        <div className="chat-header-share-capture-offscreen" aria-hidden>
          <div ref={captureOffscreenRef}>
            <ChatConversationPreview
              title={sharePreviewTitle}
              messages={previewMessages}
              isDark={isDark}
              captureMode
            />
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default ChatHeader;
