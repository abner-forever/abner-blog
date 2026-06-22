/**
 * FormSubmit 提交按钮组件
 *
 * 必须放在 Form 容器内使用，触发表单提交
 * 展示 loading 状态
 */

import React from 'react';
import type { BaseComponentProps, FormSubmitNodeProps } from '../types';
import { useFormContext } from './Form';

const FormSubmit: React.FC<BaseComponentProps> = ({ node, children }) => {
  const { text = '提交' } = node.props as FormSubmitNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;
  const formCtx = useFormContext();

  const loading = formCtx?.submitting ?? false;
  const submitted = formCtx?.submitted ?? false;

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 32px',
    background: submitted ? '#52c41a' : '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'background 0.2s',
    lineHeight: 1.4,
    ...style,
  };

  return (
    <button
      id={node.props.id as string}
      type="submit"
      style={buttonStyle}
      disabled={loading || submitted}
      onClick={(e) => {
        if (formCtx) {
          e.preventDefault();
          formCtx.submit();
        }
      }}
    >
      {loading ? (
        <>
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'formSpin 0.6s linear infinite',
            }}
          />
          提交中…
        </>
      ) : submitted ? (
        <>✅ {text}</>
      ) : (
        text
      )}
      {children}
    </button>
  );
};

export default React.memo(FormSubmit);
