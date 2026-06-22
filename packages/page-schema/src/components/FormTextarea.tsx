/**
 * FormTextarea 多行文本输入框组件
 *
 * 与 Form 容器的 FormContext 联动管理值状态
 */

import React, { useEffect, useId } from 'react';
import type { BaseComponentProps, FormTextareaNodeProps } from '../types';
import { useFormContext } from './Form';

const FormTextarea: React.FC<BaseComponentProps> = ({ node }) => {
  const { label, name, placeholder, required, rows = 4 } =
    node.props as unknown as FormTextareaNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;
  const formCtx = useFormContext();
  const id = useId();

  useEffect(() => {
    if (formCtx && name) {
      formCtx.register({ name, required });
    }
  }, [formCtx, name, required]);

  const value = formCtx ? (formCtx.values[name] as string) ?? '' : '';
  const error = formCtx ? formCtx.errors[name] : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    formCtx?.setValue(name, e.target.value);
  };

  const containerStyle: React.CSSProperties = {
    marginBottom: 16,
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 4,
    fontSize: 14,
    fontWeight: 500,
    color: '#333',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
    borderRadius: 4,
    fontSize: 14,
    boxSizing: 'border-box',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  };

  const errorStyle: React.CSSProperties = {
    marginTop: 2,
    fontSize: 12,
    color: '#ff4d4f',
  };

  return (
    <div id={node.props.id as string} style={containerStyle}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
        onChange={handleChange}
        style={textareaStyle}
        disabled={formCtx?.submitting}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <div id={`${id}-error`} style={errorStyle} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(FormTextarea);
