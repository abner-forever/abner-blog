import React, { memo } from 'react';
import { Spin, Tooltip } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import AssistantCardRenderer from './ResultCards';
import MarkdownRenderer from './MarkdownRenderer';
import BlogPublishDraftCard, {
  BlogPublishedBanner,
} from './BlogPublishDraftCard';
import ThinkingTypingView from './ThinkingTypingView';
import type { Message } from '../types';
import { mergeBlogPublishDraftWithStrippedBody } from '../utils/parse-blog-publish-block';
import { assistantMarkdownForRender } from '../utils/assistant-markdown';

interface Props {
  messages: Message[];
  loading: boolean;
  isDark: boolean;
  expandedThinkingMessageIds: Set<string>;
  onToggleThinkingExpanded: (messageId: string) => void;
  onCopyMessage: (content: string, e: React.MouseEvent) => void;
  onRegenerateMessage: (assistantMessageId: string) => void;
  messagesEndRef: React.Ref<HTMLDivElement>;
  thinkingProcessLabel: string;
  webSearchRetrievingLabel: string;
  expandThinkingAriaLabel: string;
  collapseThinkingAriaLabel: string;
  copyAriaLabel: string;
  regenerateAriaLabel: string;
}

const ChatMessageList: React.FC<Props> = memo(function ChatMessageList({
  messages,
  loading,
  isDark,
  expandedThinkingMessageIds,
  onToggleThinkingExpanded,
  onCopyMessage,
  onRegenerateMessage,
  messagesEndRef,
  thinkingProcessLabel,
  webSearchRetrievingLabel,
  expandThinkingAriaLabel,
  collapseThinkingAriaLabel,
  copyAriaLabel,
  regenerateAriaLabel,
}) {
  return (
    <div className="chat-messages">
      {(messages || []).map((message) => (
        <div
          key={message.id}
          className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
        >
          <div className="message-content">
            <div
              className={`message-bubble ${
                message.role === 'assistant' && message.card && message.isComplete
                  ? 'card-only'
                  : ''
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="assistant-message">
                  {message.webSearchStatus === 'searching' ? (
                    <div
                      className="assistant-web-search-loading"
                      role="status"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      <Spin size="small" />
                      <span className="assistant-web-search-loading__text">
                        {webSearchRetrievingLabel}
                      </span>
                    </div>
                  ) : null}
                  {message.thinkingContent ? (
                    <div className="assistant-thinking">
                      <div className="assistant-thinking__header">
                        <span>{thinkingProcessLabel}</span>
                        {message.thinkingStatus === 'streaming' ? (
                          <span className="assistant-thinking__loading">...</span>
                        ) : null}
                        <button
                          type="button"
                          className="assistant-thinking__toggle"
                          onClick={() => onToggleThinkingExpanded(message.id)}
                          aria-label={
                            expandedThinkingMessageIds.has(message.id)
                              ? collapseThinkingAriaLabel
                              : expandThinkingAriaLabel
                          }
                        >
                          <span
                            className={`assistant-thinking__arrow ${
                              expandedThinkingMessageIds.has(message.id)
                                ? 'expanded'
                                : ''
                            }`}
                          />
                        </button>
                      </div>
                      <ThinkingTypingView
                        content={message.thinkingContent}
                        expanded={expandedThinkingMessageIds.has(message.id)}
                        isDark={isDark}
                        isStreaming={message.thinkingStatus === 'streaming'}
                      />
                    </div>
                  ) : null}
                  {message.card && message.isComplete ? (
                    <AssistantCardRenderer card={message.card} />
                  ) : (
                    <MarkdownRenderer
                      key={message.id}
                      content={assistantMarkdownForRender(message)}
                      isDark={isDark}
                    />
                  )}
                  {message.blogPublished ? (
                    <BlogPublishedBanner
                      blogId={message.blogPublished.id}
                      title={message.blogPublished.title}
                    />
                  ) : null}
                  {message.blogPublishDraft && !message.blogPublished ? (
                    <BlogPublishDraftCard
                      messageId={message.id}
                      draft={mergeBlogPublishDraftWithStrippedBody(
                        message.blogPublishDraft,
                        message.content,
                      )}
                    />
                  ) : null}
                  {!message.isComplete &&
                    loading &&
                    message.webSearchStatus !== 'searching' &&
                    (!message.displayContent || message.answerStatus !== 'streaming') && (
                      <span className="thinking-dots">...</span>
                    )}
                </div>
              ) : (
                <div className="user-message-body">
                  {message.images && message.images.length > 0 && (
                    <div className="user-message-images">
                      {message.images.map((im, idx) => (
                        <img
                          key={`${message.id}-img-${idx}`}
                          src={im.previewUrl}
                          alt=""
                          className="user-message-img"
                        />
                      ))}
                    </div>
                  )}
                  {message.content ? (
                    <div className="user-message-text">{message.content}</div>
                  ) : null}
                </div>
              )}
            </div>
            {message.role === 'assistant' &&
              message.content &&
              message.isComplete !== false && (
                <div className="message-toolbar">
                  <Tooltip title={regenerateAriaLabel}>
                    <button
                      className="msg-copy-btn"
                      onClick={() => onRegenerateMessage(message.id)}
                      aria-label={regenerateAriaLabel}
                    >
                      <ReloadOutlined />
                    </button>
                  </Tooltip>
                  <Tooltip title={copyAriaLabel}>
                    <button
                      className="msg-copy-btn"
                      onClick={(e) => onCopyMessage(message.content, e)}
                      aria-label={copyAriaLabel}
                    >
                      <CopyOutlined />
                    </button>
                  </Tooltip>
                </div>
              )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default ChatMessageList;
