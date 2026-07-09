import React, { memo, useMemo, useRef, useCallback } from 'react';
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
import { useVoiceInput } from '../hooks/useVoiceInput';

const { TextArea } = Input;

// Waveform equalizer icon — 6-bar SVG, matches Claude Code voice button style
const VoiceWaveformIcon = ({ recording }: { recording?: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="voice-waveform-icon"
  >
    {[
      { x: 1, y: 8, h: 6 },
      { x: 4.5, y: 6, h: 10 },
      { x: 8, y: 3, h: 16 },
      { x: 11.5, y: 6, h: 10 },
      { x: 15, y: 3, h: 16 },
      { x: 18.5, y: 8, h: 6 },
    ].map((bar, i) => (
      <rect
        key={i}
        x={bar.x}
        y={bar.y}
        width="2"
        height={bar.h}
        rx="1"
        fill="currentColor"
        className={`waveform-bar${recording ? ' animating' : ''}`}
        style={recording ? { animationDelay: `${i * 0.12}s` } : undefined}
      />
    ))}
  </svg>
);

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
    const voice = useVoiceInput();
    const hasAttachments = attachments.length > 0;
    const expanded = inputFocused || value || hasAttachments || voice.recording;

    // Mobile touch tracking
    const isTouchRef = useRef(false);

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

    // Voice button handlers
    const handleVoiceClick = useCallback(async () => {
      if (voice.recording) {
        const text = await voice.stopListening();
        if (text) {
          onChange(value ? `${value}${value.endsWith(' ') || value.endsWith('\n') ? '' : ' '}${text}` : text);
        }
      } else {
        voice.startListening();
      }
    }, [voice, onChange, value]);

    const handleVoiceTouchStart = useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        isTouchRef.current = true;
        voice.startListening();
      },
      [voice],
    );

    const handleVoiceTouchEnd = useCallback(
      async (e: React.TouchEvent) => {
        e.preventDefault();
        isTouchRef.current = false;
        const text = await voice.stopListening();
        if (text) {
          onChange(value ? `${value}${value.endsWith(' ') || value.endsWith('\n') ? '' : ' '}${text}` : text);
        }
      },
      [voice, onChange, value],
    );

    // Determine placeholder text
    const currentPlaceholder = voice.recording
      ? '🎤 正在录音... 说完后点击停止'
      : voice.error
        ? '❌ ' + voice.error
        : placeholder;

    // Determine model label to display
    const currentModelLabel = useMemo(() => {
      const found = MODEL_VENDORS.flatMap((v) => v.models).find(
        (m) => m.value === model,
      );
      return found?.label || model;
    }, [model]);

    return (
      <div className="chat-input-area">
        <div
          className={`input-container${expanded ? ' focused' : ''}${loading ? ' is-sending' : ''}${voice.recording ? ' is-recording' : ''}`}
          onClick={handleContainerClick}
        >
          <div className="input-wrapper">
            {imageUploadSupported && hasAttachments && (
              <div className="chat-attachment-row">
                {attachments.map((a) => (
                  <div key={a.id} className="chat-attachment-chip">
                    <img src={a.previewUrl} alt="" loading="lazy" />
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

              {/* Textarea with floating action buttons */}
            <div className="chat-textarea-wrapper">
              <TextArea
                value={voice.recording ? `${value}${voice.interimText ? ' ' + voice.interimText : ''}` : value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={currentPlaceholder}
                autoSize={{ minRows: expanded ? 3 : 1, maxRows: 10 }}
                disabled={loading}
                className="chat-textarea"
              />

              {/* Voice status bar — shows recording state or error message */}
              {(voice.recording || voice.error) && (
                <div
                  className={`chat-voice-status${voice.error ? ' chat-voice-status--error' : ''}`}
                >
                  {voice.recording && !voice.error ? '🎤 正在录音...'
                    : voice.error ? `❌ ${voice.error}`
                    : null}
                </div>
              )}

              {/* Floating actions inside textarea: voice + send */}
              <div className="chat-textarea-actions">
                {/* Voice button */}
                {voice.supported && (
                  <button
                    type="button"
                    className={`chat-voice-btn${voice.recording ? ' is-recording' : ''}`}
                    onClick={handleVoiceClick}
                    onTouchStart={handleVoiceTouchStart}
                    onTouchEnd={handleVoiceTouchEnd}
                    aria-label={voice.recording ? '停止录音' : '语音输入'}
                    disabled={loading}
                  >
                    <VoiceWaveformIcon recording={voice.recording} />
                  </button>
                )}

                {/* Send / Stop button */}
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

            {/* Bottom toolbar */}
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
                {/* Model selector — pill style, consistent 14px */}
                <Select
                  value={model}
                  onChange={onModelChange}
                  options={modelOptions}
                  className="chat-input-model-selector"
                  popupMatchSelectWidth={false}
                  classNames={{ popup: { root: 'chat-input-model-selector-dropdown' } }}
                  variant="borderless"
                />
              </div>
            </div>
          </div>
        </div>
        {imageUploadSupported && expanded && !voice.recording && (
          <span className="chat-input-area__hint">{pasteHint}</span>
        )}
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
