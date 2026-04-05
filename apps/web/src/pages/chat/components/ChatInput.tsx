import React, { memo } from 'react';
import { Button, Input } from 'antd';
import {
  ArrowUpOutlined,
  PictureOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ChatImagePayload } from '../utils/chat-images';

const { TextArea } = Input;

const ChatInput = memo<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  loading: boolean;
  inputFocused: boolean;
  canSend: boolean;
  attachments: ChatImagePayload[];
  onRemoveAttachment: (id: string) => void;
  onPickImage: () => void;
  attachLabel: string;
  pasteHint: string;
  placeholder: string;
  sendShortcutHint: string;
  stopLabel: string;
  sendLabel: string;
  imageUploadSupported: boolean;
}>(
  ({
    value,
    onChange,
    onSend,
    onStop,
    onFocus,
    onBlur,
    onKeyDown,
    onPaste,
    loading,
    inputFocused,
    canSend,
    attachments,
    onRemoveAttachment,
    onPickImage,
    attachLabel,
    pasteHint,
    placeholder,
    sendShortcutHint,
    stopLabel,
    sendLabel,
    imageUploadSupported,
  }) => {
    const expanded = inputFocused || value || attachments.length > 0;
    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"]')) {
        return;
      }

      const textarea = e.currentTarget.querySelector('textarea');
      textarea?.focus();
    };

    return (
      <div className="chat-input-area">
        <div
          className={`input-container${expanded ? ' focused' : ''}${loading ? ' is-sending' : ''}`}
          onClick={handleContainerClick}
        >
          <div className="input-wrapper">
            {imageUploadSupported && attachments.length > 0 && (
              <div className="chat-attachment-row">
                {attachments.map((a) => (
                  <div key={a.id} className="chat-attachment-chip">
                    <img src={a.previewUrl} alt="" />
                    <button
                      type="button"
                      className="chat-attachment-remove"
                      onClick={() => onRemoveAttachment(a.id)}
                      aria-label="remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <TextArea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onFocus={onFocus}
              onBlur={onBlur}
              placeholder={placeholder}
              autoSize={{ minRows: expanded ? 3 : 1, maxRows: 10 }}
              disabled={loading}
              className="chat-textarea"
            />
            <div className="chat-input-footer">
              <div className="chat-input-footer__left">
                {imageUploadSupported && (
                  <>
                    <button
                      type="button"
                      className="chat-input-pill"
                      onClick={onPickImage}
                      disabled={loading}
                    >
                      <PictureOutlined className="chat-input-pill__icon" />
                      <span className="chat-input-pill__text">
                        {attachLabel}
                      </span>
                    </button>
                    <span className="chat-input-footer__hint">{pasteHint}</span>
                  </>
                )}
              </div>
              <div className="chat-input-footer__right">
                <span className="chat-input-footer__shortcut">
                  {sendShortcutHint}
                </span>
                {loading ? (
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<StopOutlined />}
                    onClick={onStop}
                    className="chat-send-fab chat-send-fab--stop"
                    aria-label={stopLabel}
                  />
                ) : (
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<ArrowUpOutlined />}
                    onClick={onSend}
                    disabled={!canSend}
                    className="chat-send-fab"
                    aria-label={sendLabel}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
