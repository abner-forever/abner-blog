import React, { memo, useRef, useLayoutEffect, useCallback } from 'react';
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
  // 滚动容器引用
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 标记用户是否在底部（或接近底部），默认 true
  const isAtBottomRef = useRef(true);

  // 监听滚动事件，判断用户是否在底部
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // 距离底部 50px 以内视为"在底部"
    const threshold = 50;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isAtBottomRef.current = atBottom;
  }, []);

  // 仅在用户位于底部时自动滚动到最新内容
  useLayoutEffect(() => {
    if (messages.length === 0) return;
    if (!isAtBottomRef.current) return;
    // 使用 setTimeout 确保在下一次绘制后滚动，避免与内容更新竞争
    // （scrollIntoView 本身是同步的，但在流式更新频繁触发 layout effect 时，
    //  延迟一帧可以让 DOM 先完成内容渲染再定位）
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    });
  }, [messages, messagesEndRef]);

  return (
    <div className="chat-messages" ref={scrollContainerRef} onScroll={handleScroll}>
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
                <>
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
                          <span className="thinking-dots thinking-dots--sm" aria-label="思考中">
                            <span className="thinking-dots__dot" />
                            <span className="thinking-dots__dot" />
                            <span className="thinking-dots__dot" />
                          </span>
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
                      <span className="thinking-dots" aria-label="正在生成">
                        <span className="thinking-dots__dot" />
                        <span className="thinking-dots__dot" />
                        <span className="thinking-dots__dot" />
                      </span>
                    )}
                </>
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
