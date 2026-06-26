/**
 * FormSelect 下拉选择组件
 *
 * 与 Form 容器的 FormContext 联动管理值状态
 */

import React, { useEffect, useId, useState, useCallback } from 'react';
import type { BaseComponentProps, FormSelectNodeProps } from '../types';
import { useFormContext } from './Form';

const FormSelect: React.FC<BaseComponentProps> = ({ node }) => {
  const { label, name, options, required, value: propValue, placeholder } =
    node.props as unknown as FormSelectNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;
  const formCtx = useFormContext();
  const id = useId();

  // 独立使用时的内部状态，优先使用 props 中的 value（变量绑定）
  const [internalValue, setInternalValue] = useState(propValue ?? '');
  const [internalError, setInternalError] = useState<string | undefined>();

  useEffect(() => {
    if (formCtx && name) {
      formCtx.register({ name, required });
    }
  }, [formCtx, name, required]);

  // 当 props.value 变化时（变量绑定更新），同步到内部状态
  useEffect(() => {
    if (propValue !== undefined && !formCtx) {
      setInternalValue(propValue);
    }
  }, [propValue, formCtx]);

  // 有 FormContext 时使用 FormContext 的值，否则使用内部状态
  const value = formCtx
    ? (formCtx.values[name] as string) ?? ''
    : internalValue;
  const error = formCtx ? formCtx.errors[name] : internalError;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
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
    },
    [formCtx, name, required],
  );

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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 40px 8px 12px',
    border: error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
    borderRadius: 4,
    fontSize: 14,
    boxSizing: 'border-box',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>')}")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
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
      <select
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={handleChange}
        style={selectStyle}
        disabled={formCtx?.submitting}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">{placeholder || '请选择'}</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <div id={`${id}-error`} style={errorStyle} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(FormSelect);
