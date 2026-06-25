import React, { memo, useMemo } from 'react';
import classNames from 'classnames';
import { Button } from 'antd';
import MarkdownRenderer from './MarkdownRenderer';
import { stripAbnerBlogPublishBlock } from '../utils/parse-blog-publish-block';
import '../index.less';
import './ChatConversationPreview.less';

export interface ChatPreviewMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatConversationPreviewProps {
  messages: ChatPreviewMessage[];
  isDark: boolean;
  title?: string;
  /** 导出图片时使用更稳妥的纯色背景，便于离屏截图渲染 */
  captureMode?: boolean;
  className?: string;
  showCopyActions?: boolean;
  copyLabel?: string;
  onCopyMessage?: (payload: { id: string; content: string }) => void;
}

const ChatConversationPreview: React.FC<ChatConversationPreviewProps> = memo(
  function ChatConversationPreview({
    messages,
    isDark,
    title,
    captureMode,
    className,
    showCopyActions,
    copyLabel,
    onCopyMessage,
  }) {
    const normalized = useMemo(
      () =>
        messages.map((m) => ({
          ...m,
          assistantMd:
            m.role === 'assistant' ? stripAbnerBlogPublishBlock(m.content || '') : '',
        })),
      [messages],
    );

    return (
      <div
        className={classNames(
          'chat-messages',
          'chat-conversation-preview',
          captureMode && 'chat-conversation-preview--capture',
          className,
        )}
      >
        {title ? <div className="chat-conversation-preview__title">{title}</div> : null}
        {normalized.map((msg) => (
          <div key={msg.id} className="chat-conversation-preview__row">
            <div
              className={classNames('message', msg.role === 'user' ? 'user' : 'assistant')}
            >
              <div className="message-content">
                <div className="message-bubble">
                  {msg.role === 'assistant' ? (
                    <div className="assistant-message">
                      <MarkdownRenderer content={msg.assistantMd} isDark={isDark} />
                    </div>
                  ) : (
                    <div className="user-message-body">
                      {msg.content ? (
                        <div className="user-message-text">{msg.content}</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {showCopyActions && onCopyMessage && copyLabel ? (
              <div className="chat-conversation-preview__actions">
                <Button
                  type="link"
                  size="small"
                  onClick={() => onCopyMessage({ id: msg.id, content: msg.content })}
                >
                  {copyLabel}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  },
);

export default ChatConversationPreview;
