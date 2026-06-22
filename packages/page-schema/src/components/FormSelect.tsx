/**
 * FormSelect 下拉选择组件
 *
 * 与 Form 容器的 FormContext 联动管理值状态
 */

import React, { useEffect, useId } from 'react';
import type { BaseComponentProps, FormSelectNodeProps } from '../types';
import { useFormContext } from './Form';

const FormSelect: React.FC<BaseComponentProps> = ({ node }) => {
  const { label, name, options, required } = node.props as unknown as FormSelectNodeProps;
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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
    borderRadius: 4,
    fontSize: 14,
    boxSizing: 'border-box',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    cursor: 'pointer',
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
        <option value="">请选择</option>
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
