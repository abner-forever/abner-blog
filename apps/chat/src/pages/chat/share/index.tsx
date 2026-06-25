import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spin, Result, Button, message } from 'antd';
import { CopyOutlined, PictureOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAppSelector } from '@/store/reduxHooks';
import { useChatShareControllerFindOne } from '@services/generated/chat-share/chat-share';
import ChatConversationPreview, {
  type ChatPreviewMessage,
} from '../components/ChatConversationPreview';
import {
  MAX_SESSIONS,
  STORAGE_KEY,
  sessionsForLocalStorage,
} from '../constants';
import type { ChatSession, Message } from '../types';
import { stripAbnerBlogPublishBlock } from '../utils/parse-blog-publish-block';
import {
  copyElementImageToClipboard,
  downloadElementImageAsPng,
  logChatCopyImageFailure,
  sanitizeChatImageFilename,
} from '../utils/export-chat-image';
import './share.less';

const ChatSharePage: React.FC = memo(function ChatSharePage() {
  const { t } = useTranslation();
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const theme = useAppSelector((s) => s.theme.theme);

  const isDark = useMemo(() => {
    return (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  }, [theme]);

  const { data, isLoading, isError } = useChatShareControllerFindOne(shareId || '', {
    query: {
      enabled: !!shareId,
    },
  });

  const captureOffscreenRef = useRef<HTMLDivElement>(null);
  const [imageExporting, setImageExporting] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);
  const [exportMount, setExportMount] = useState(false);
  const imageBusy = imageExporting || imageDownloading;

  const messages: ChatPreviewMessage[] = useMemo(() => {
    if (!data?.messages || !Array.isArray(data.messages)) return [];
    const raw = data.messages as unknown[];
    if (raw.length === 0) return [];
    if (typeof raw[0] === 'string') {
      try {
        return (raw as string[]).map((m, idx) => {
          const parsed = typeof m === 'string' ? JSON.parse(m) : m;
          return {
            id: String((parsed as { id?: string }).id || `msg-${idx}`),
            role: (parsed as { role: 'user' | 'assistant' }).role,
            content: String((parsed as { content?: string }).content || ''),
            timestamp: Number((parsed as { timestamp?: number }).timestamp) || 0,
          };
        });
      } catch {
        return [];
      }
    }
    return (raw as ChatPreviewMessage[]).map((m, idx) => ({
      id: m.id || `msg-${idx}`,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));
  }, [data]);

  const shareTitle = data?.title || t('chat.shareDefaultTitle');

  const handleCopyToChat = () => {
    try {
      const mappedMessages: Message[] = messages.map((m) => {
        const content = m.content;
        const display =
          m.role === 'assistant' ? stripAbnerBlogPublishBlock(content) : content;
        return {
          id: m.id,
          role: m.role,
          content,
          displayContent: display,
          images: [],
          timestamp: m.timestamp ?? Date.now(),
          isComplete: true,
        };
      });

      const sharedSession: ChatSession = {
        id: `shared-${Date.now()}`,
        title: shareTitle,
        messages: mappedMessages,
        timestamp: Date.now(),
        model: 'gpt-5-chat-latest',
      };

      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ChatSession[];
      const next = sessionsForLocalStorage(
        [sharedSession, ...existing].slice(0, MAX_SESSIONS),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      message.success(t('chat.shareCopyToChatDone'));
      navigate('/chat');
    } catch {
      message.error(t('chat.shareCopyToChatFailed'));
    }
  };

  const handleCopyOne = useCallback(({ content }: { id: string; content: string }) => {
    void navigator.clipboard.writeText(content);
    message.success(t('chat.shareMessageCopyDone'));
  }, [t]);

  const handleDownloadImage = useCallback(async () => {
    if (messages.length === 0) {
      message.warning(t('chat.shareNoMessagesToExport'));
      return;
    }
    setImageExporting(true);
    message.loading({ content: t('chat.shareImageGenerating'), key: 'share-img', duration: 0 });
    try {
      flushSync(() => {
        setExportMount(true);
      });
      await new Promise<void>((r) => {
        requestAnimationFrame(() => requestAnimationFrame(() => r()));
      });
      const el = captureOffscreenRef.current;
      if (!el) {
        logChatCopyImageFailure('ChatSharePage.handleDownloadImage', new Error('capture root missing'), {
          exportMount: true,
          messageCount: messages.length,
          shareId,
        });
        throw new Error('capture root missing');
      }
      await copyElementImageToClipboard(el);
      message.destroy('share-img');
      message.success(t('chat.shareImageCopied'));
    } catch (err) {
      logChatCopyImageFailure('ChatSharePage.handleDownloadImage', err, {
        derivedCode: err instanceof Error ? err.message : '',
        messageCount: messages.length,
        shareId,
      });
      message.destroy('share-img');
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
  }, [messages.length, shareId, t]);

  const handleDownloadImageToFile = useCallback(async () => {
    if (messages.length === 0) {
      message.warning(t('chat.shareNoMessagesToExport'));
      return;
    }
    setImageDownloading(true);
    message.loading({ content: t('chat.shareImageGenerating'), key: 'share-img-dl', duration: 0 });
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
          'ChatSharePage.handleDownloadImageToFile',
          new Error('capture root missing'),
          {
            exportMount: true,
            messageCount: messages.length,
            shareId,
          },
        );
        throw new Error('capture root missing');
      }
      const base = sanitizeChatImageFilename(shareId || 'chat');
      await downloadElementImageAsPng(el, `chat-share-${base}.png`);
      message.destroy('share-img-dl');
      message.success(t('chat.shareImageDownloaded'));
    } catch (err) {
      logChatCopyImageFailure('ChatSharePage.handleDownloadImageToFile', err, {
        derivedCode: err instanceof Error ? err.message : '',
        messageCount: messages.length,
        shareId,
      });
      message.destroy('share-img-dl');
      message.error(t('chat.shareImageDownloadFailed'));
    } finally {
      setExportMount(false);
      setImageDownloading(false);
    }
  }, [messages.length, shareId, t]);

  if (isLoading) {
    return (
      <div className="chat-share-page">
        <div className="chat-share-page__container chat-share-page__container--centered">
          <Spin size="large" tip={t('chat.sharePageLoading')} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="chat-share-page">
        <div className="chat-share-page__container chat-share-page__container--centered">
          <Result
            status="error"
            title={t('chat.shareLoadErrorTitle')}
            subTitle={t('chat.shareLoadErrorDesc')}
            extra={[
              <Button type="primary" key="chat" onClick={() => navigate('/chat')}>
                {t('chat.shareStartNewChat')}
              </Button>,
              <Button key="home" onClick={() => navigate('/')}>
                {t('chat.shareBackHome')}
              </Button>,
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-share-page">
      <div className="chat-share-page__header">
        <h1 className="chat-share-page__title">{shareTitle}</h1>
        <div className="chat-share-page__actions">
          <Button
            icon={<PictureOutlined />}
            loading={imageExporting}
            onClick={() => void handleDownloadImage()}
            disabled={messages.length === 0 || imageBusy}
          >
            {t('chat.shareCopyImage')}
          </Button>
          <Button
            icon={<DownloadOutlined />}
            loading={imageDownloading}
            onClick={() => void handleDownloadImageToFile()}
            disabled={messages.length === 0 || imageBusy}
          >
            {t('chat.shareDownloadImage')}
          </Button>
          <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyToChat}>
            {t('chat.shareCopyToChat')}
          </Button>
        </div>
      </div>

      <div className="chat-share-page__container">
        {messages.length === 0 ? (
          <Result status="info" title={t('chat.shareEmptyTitle')} subTitle={t('chat.shareEmptyDesc')} />
        ) : (
          <ChatConversationPreview
            title={shareTitle}
            messages={messages}
            isDark={isDark}
            showCopyActions
            copyLabel={t('chat.shareCopyMessage')}
            onCopyMessage={handleCopyOne}
          />
        )}
      </div>

      {exportMount ? (
        <div className="chat-share-page__offscreen" aria-hidden>
          <div ref={captureOffscreenRef}>
            <ChatConversationPreview
              title={shareTitle}
              messages={messages}
              isDark={isDark}
              captureMode
            />
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default ChatSharePage;
