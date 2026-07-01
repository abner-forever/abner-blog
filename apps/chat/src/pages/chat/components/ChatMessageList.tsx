import React, { memo, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { Spin, Tooltip } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
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

/** 用户消息估算高度（无图片时更小） */
function estimateMessageSize(message: Message): number {
  if (message.role === 'user') {
    const hasImages = (message.images?.length ?? 0) > 0;
    const textLen = message.content?.length ?? 0;
    if (hasImages) return textLen > 50 ? 200 : 140;
    return textLen > 50 ? 80 : 48;
  }
  // assistant 消息
  let h = 24; // padding
  if (message.webSearchStatus === 'searching') h += 40;
  if (message.thinkingContent) {
    h += 40; // header
    h += message.thinkingStatus === 'streaming' ? 80 : 60;
  }
  if (message.card && message.isComplete) {
    h += 120;
  } else {
    const textLen = (message.displayContent ?? message.content ?? '').length;
    // 粗略估算：每 80 字符 ≈ 20px
    h += Math.max(60, Math.ceil(textLen / 80) * 20);
  }
  if (message.blogPublished) h += 40;
  if (message.blogPublishDraft && !message.blogPublished) h += 180;
  if (message.isComplete === false && message.answerStatus !== 'streaming') {
    h += 24; // thinking dots
  }
  // toolbar
  if (message.content && message.isComplete !== false) h += 36;
  return Math.max(60, h);
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const initScrollDoneRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => estimateMessageSize(messages[index]),
    overscan: 5,
  });

  // 监听滚动事件，判断用户是否在底部
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const threshold = 50;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isAtBottomRef.current = atBottom;
  }, []);

  // 每次渲染后用 scrollHeight 强制将视口保持在底部（仅当用户在底部时）。
  // 不依赖具体变量，而是每次渲染都检查，能自动覆盖所有场景：
  //   消息数量变化、流式内容更新、virtualizer measureElement 后估算高度修正等。
  // 使用 scrollHeight 而非 virtualizer.scrollToIndex，
  // 避免估算高度与实际高度差异导致的页面跳变。
  useLayoutEffect(() => {
    if (messages.length === 0) return;
    if (!isAtBottomRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  });

  // 页面返回时：等待 CSSTransition 转场（300ms）和虚拟列表测量完成后，强制滚动到底部
  // 用 scrollTop 替代 scrollToIndex 避免虚拟列表估算误差，并在多个帧后重试直至稳定
  useEffect(() => {
    if (messages.length === 0) return;
    if (initScrollDoneRef.current) return;
    initScrollDoneRef.current = true;

    const scrollToEnd = () => {
      const el = scrollContainerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    };

    // 延迟等待转场动画完成
    const timer = setTimeout(scrollToEnd, 350);

    // 转场后还需要多次重试：虚拟列表测量会反复改变 scrollHeight
    let rafId: number;
    let attempts = 0;
    const retry = () => {
      if (attempts >= 5) return;
      attempts += 1;
      scrollToEnd();
      rafId = requestAnimationFrame(retry);
    };
    rafId = requestAnimationFrame(retry);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [messages.length]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className="chat-messages"
      ref={scrollContainerRef}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const message = messages[virtualRow.index];
          return (
            <div
              key={message.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
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
                              loading="lazy"
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
          );
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
});

export default ChatMessageList;
