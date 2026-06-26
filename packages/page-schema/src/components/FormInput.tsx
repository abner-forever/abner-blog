/**
 * FormInput 输入框组件
 *
 * 支持 text、email、tel、number、password 类型
 * 与 Form 容器的 FormContext 联动管理值状态
 * 也可独立使用（无 Form 容器时使用内部状态）
 */

import React, { useEffect, useId, useState } from 'react';
import type { BaseComponentProps, FormInputNodeProps } from '../types';
import { useFormContext } from './Form';

const FormInput: React.FC<BaseComponentProps> = ({ node }) => {
  const {
    label,
    name,
    placeholder,
    required,
    type = 'text',
    value: propValue,
  } = node.props as unknown as FormInputNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;
  const formCtx = useFormContext();
  const id = useId();

  // 独立使用时的内部状态，优先使用 props 中的 value（变量绑定）
  const [internalValue, setInternalValue] = useState(propValue ?? '');
  const [internalError, setInternalError] = useState<string | undefined>();

  // 当 props.value 变化时（变量绑定更新），同步到内部状态
  useEffect(() => {
    if (propValue !== undefined && !formCtx) {
      setInternalValue(propValue);
    }
  }, [propValue, formCtx]);

  useEffect(() => {
    if (formCtx && name) {
      formCtx.register({ name, required });
    }
  }, [formCtx, name, required]);

  // 有 FormContext 时使用 FormContext 的值，否则使用内部状态
  // propValue 已由 variable-parser 中间件解析（{{query.xxx}} → 实际值）
  // ?? propValue 确保 URL 参数等变量能作为表单字段的初始值
  const value = formCtx
    ? (formCtx.values[name] as string) ?? propValue ?? ''
    : internalValue;
  const error = formCtx ? formCtx.errors[name] : internalError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (formCtx) {
      formCtx.setValue(name, newValue);
    } else {
      setInternalValue(newValue);
      // 简单的必填验证
      if (required && !newValue.trim()) {
        setInternalError('此字段为必填项');
      } else {
        setInternalError(undefined);
      }
    }
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
