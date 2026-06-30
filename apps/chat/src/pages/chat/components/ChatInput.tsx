import React, { memo, useMemo } from 'react';
import { Button, Input, Select } from 'antd';
import {
  ArrowUpOutlined,
  PictureOutlined,
  StopOutlined,
  BulbOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { MODEL_VENDORS } from '../constants';
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
  enableThinking: boolean;
  onToggleThinking: () => void;
  enableWebSearch: boolean;
  onToggleWebSearch: () => void;
  deepThinkingLabel: string;
  smartSearchLabel: string;
  model: string;
  onModelChange: (value: string) => void;
  hasApiKeyByProvider: Record<string, boolean>;
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
    enableThinking,
    onToggleThinking,
    enableWebSearch,
    onToggleWebSearch,
    deepThinkingLabel,
    smartSearchLabel,
    model,
    onModelChange,
    hasApiKeyByProvider,
  }) => {
    const expanded = inputFocused || value || attachments.length > 0;

    const modelOptions = useMemo(() => {
      return MODEL_VENDORS.flatMap((v) =>
        v.models.map((m) => ({
          label: m.label,
          value: m.value,
        })),
      ).filter((opt) => {
        const vendor = MODEL_VENDORS.find((v) =>
          v.models.some((m) => m.value === opt.value),
        );
        return vendor ? hasApiKeyByProvider[vendor.value] : false;
      });
    }, [hasApiKeyByProvider]);
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
            <div className="chat-input-tools">
              <div className="chat-input-tools__left">
                <button
                  type="button"
                  className={`chat-tool-btn${enableThinking ? ' active' : ''}`}
                  onClick={onToggleThinking}
                >
                  <BulbOutlined className="chat-tool-btn__icon" />
                  <span className="chat-tool-btn__text">{deepThinkingLabel}</span>
                </button>
                {imageUploadSupported && (
                  <button
                    type="button"
                    className="chat-tool-btn"
                    onClick={onPickImage}
                    disabled={loading}
                  >
                    <PictureOutlined className="chat-tool-btn__icon" />
                    <span className="chat-tool-btn__text">{attachLabel}</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`chat-tool-btn${enableWebSearch ? ' active' : ''}`}
                  onClick={onToggleWebSearch}
                >
                  <SearchOutlined className="chat-tool-btn__icon" />
                  <span className="chat-tool-btn__text">{smartSearchLabel}</span>
                </button>
              </div>
              <div className="chat-input-tools__right">
                <Select
                  value={model}
                  onChange={onModelChange}
                  options={modelOptions}
                  className="chat-input-model-selector"
                  popupMatchSelectWidth={false}
                  popupClassName="chat-input-model-selector-dropdown"
                  variant="borderless"
                />
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
        {imageUploadSupported && expanded && (
          <span className="chat-input-area__hint">{pasteHint}</span>
        )}
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
