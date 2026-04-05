import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { Input, Button, Space } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { useTranslation } from 'react-i18next';
import './index.less';

const { TextArea } = Input;

interface CommentFormProps {
  onSubmit: (content: string) => void | Promise<void>;
  loading?: boolean;
  placeholder?: string;
  maxLength?: number;
  onCancelReply?: () => void;
  replyLabel?: string;
}

export interface CommentFormRef {
  focus: () => void;
}

const CommentForm = forwardRef<CommentFormRef, CommentFormProps>(
  (
    {
      onSubmit,
      loading = false,
      placeholder = '输入评论（Enter 换行，Ctrl + Enter 发送）',
      maxLength = 1000,
      onCancelReply,
      replyLabel,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<TextAreaRef>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    const handleSubmit = async () => {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return;
      }

      try {
        await onSubmit(trimmedContent);
        setContent('');
        setIsFocused(false);
      } catch {
        // 错误处理已在父组件或 onSubmit 中完成
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSubmit();
      }
    };

    const handleCancel = () => {
      setContent('');
      setIsFocused(false);
      onCancelReply?.();
    };

    return (
      <div
        className={`comment-form-container ${isFocused || content ? 'focused' : ''}`}
      >
        <div className="form-main">
          <TextArea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => !content && setIsFocused(false)}
            placeholder={placeholder}
            maxLength={maxLength}
            autoSize={{ minRows: isFocused || content ? 3 : 1, maxRows: 10 }}
            className="comment-textarea"
          />

          {(isFocused || content || replyLabel) && (
            <div className="form-actions-row">
              <div className="form-tips">
                {replyLabel ? (
                  <span className="reply-indicator">
                    回复 <span className="reply-user">@{replyLabel}</span>
                  </span>
                ) : (
                  <span>{t('comment.sendShortcut')}</span>
                )}
              </div>
              <Space>
                {(replyLabel || content) && (
                  <Button onClick={handleCancel} type="text" size="small">
                    {t('common.cancel')}
                  </Button>
                )}
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  disabled={!content.trim()}
                  size="small"
                >
                  {t('comment.publish')}
                </Button>
              </Space>
            </div>
          )}
        </div>
      </div>
    );
  },
);

CommentForm.displayName = 'CommentForm';

export { CommentForm };
