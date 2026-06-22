/**
 * FormInput 输入框组件
 *
 * 支持 text、email、tel、number、password 类型
 * 与 Form 容器的 FormContext 联动管理值状态
 */

import React, { useEffect, useId } from 'react';
import type { BaseComponentProps, FormInputNodeProps } from '../types';
import { useFormContext } from './Form';

const FormInput: React.FC<BaseComponentProps> = ({ node }) => {
  const {
    label,
    name,
    placeholder,
    required,
    type = 'text',
  } = node.props as unknown as FormInputNodeProps;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
    borderRadius: 4,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
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
      <input
        id={id}
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={handleChange}
        style={inputStyle}
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

export default React.memo(FormInput);
