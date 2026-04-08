import React, { memo } from 'react';
import { Avatar, Spin } from 'antd';
import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import AssistantCardRenderer from './ResultCards';
import MarkdownRenderer from './MarkdownRenderer';
import ThinkingTypingView from './ThinkingTypingView';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  loading: boolean;
  userAvatar?: string;
  isDark: boolean;
  expandedThinkingMessageIds: Set<string>;
  onToggleThinkingExpanded: (messageId: string) => void;
  onCopyMessage: (content: string, e: React.MouseEvent) => void;
  messagesEndRef: React.Ref<HTMLDivElement>;
  thinkingProcessLabel: string;
  webSearchRetrievingLabel: string;
  expandThinkingAriaLabel: string;
  collapseThinkingAriaLabel: string;
  copyLabel: string;
}

const ChatMessageList: React.FC<Props> = memo(function ChatMessageList({
  messages,
  loading,
  userAvatar,
  isDark,
  expandedThinkingMessageIds,
  onToggleThinkingExpanded,
  onCopyMessage,
  messagesEndRef,
  thinkingProcessLabel,
  webSearchRetrievingLabel,
  expandThinkingAriaLabel,
  collapseThinkingAriaLabel,
  copyLabel,
}) {
  return (
    <div className="chat-messages">
      {(messages || []).map((message) => (
        <div
          key={message.id}
          className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
        >
          <div className="message-avatar">
            {message.role === 'user' ? (
              <Avatar
                size={36}
                src={userAvatar || undefined}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#95ec69' }}
              />
            ) : (
              <Avatar
                size={36}
                icon={<RobotOutlined />}
                style={{ backgroundColor: '#10b981' }}
              />
            )}
          </div>
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
                      content={message.displayContent || message.content}
                      isDark={isDark}
                    />
                  )}
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
                  <button
                    className="msg-copy-btn"
                    onClick={(e) => onCopyMessage(message.content, e)}
                  >
                    {copyLabel}
                  </button>
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
