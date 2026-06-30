import React, { memo, useMemo, useRef, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Modal,
  Input,
  message,
  Spin,
} from 'antd';
import {
  MenuOutlined,
  MessageOutlined,
  ShareAltOutlined,
  SettingOutlined,
  CopyOutlined,
  CheckOutlined,
  PictureOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useChat } from '../../context/ChatContext';
import type { ChatSession } from '../../types';
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
  const { state, dispatch, isDark } = useChat();
  const { sessions, currentSessionId } = state;
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

  const sharePreviewTitle = sharePreviewSession?.title || t('chat.shareDefaultTitle');

  return (
    <div className="chat-header">
      {/* Mobile: left hamburger menu — hidden on desktop */}
      <div className="header-left">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => dispatch({ type: 'SET_MOBILE_DRAWER_OPEN', payload: true })}
          className="menu-btn"
        />
      </div>

      {/* Mobile: center title — hidden on desktop */}
      <div className="chat-title">
        <div className="title-icon">
          <MessageOutlined />
        </div>
        <div className="title-text">
          <span className="title-main">龙码 AI</span>
          <span className="title-sub">LongMa AI</span>
        </div>
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
        <Button
          type="text"
          icon={<SettingOutlined />}
          className="header-btn"
          onClick={() => dispatch({ type: 'SET_SHOW_CHAT_SETTINGS', payload: true })}
        >
          <span className="btn-text">{t('chat.settings')}</span>
        </Button>
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
