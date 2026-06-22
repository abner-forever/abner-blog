/**
 * FormCheckbox 复选框组件
 *
 * 与 Form 容器的 FormContext 联动管理值状态
 */

import React, { useEffect, useId } from 'react';
import type { BaseComponentProps, FormCheckboxNodeProps } from '../types';
import { useFormContext } from './Form';

const FormCheckbox: React.FC<BaseComponentProps> = ({ node }) => {
  const { label, name, required } = node.props as unknown as FormCheckboxNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;
  const formCtx = useFormContext();
  const id = useId();

  useEffect(() => {
    if (formCtx && name) {
      formCtx.register({ name, required });
    }
  }, [formCtx, name, required]);

  const checked = formCtx ? !!(formCtx.values[name]) : false;
  const error = formCtx ? formCtx.errors[name] : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formCtx?.setValue(name, e.target.checked);
  };

  const containerStyle: React.CSSProperties = {
    marginBottom: 16,
    ...style,
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    cursor: 'pointer',
    color: '#333',
  };

  const checkboxStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    cursor: 'pointer',
    accentColor: '#1890ff',
  };

  const errorStyle: React.CSSProperties = {
    marginTop: 2,
    fontSize: 12,
    color: '#ff4d4f',
  };

  return (
    <div id={node.props.id as string} style={containerStyle}>
      <label htmlFor={id} style={labelStyle}>
        <input
          id={id}
          type="checkbox"
          name={name}
          required={required}
          checked={checked}
          onChange={handleChange}
          style={checkboxStyle}
          disabled={formCtx?.submitting}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>
          {label || name}
          {required && <span style={{ color: '#ff4d4f', marginLeft: 2 }}>*</span>}
        </span>
      </label>
      {error && (
        <div id={`${id}-error`} style={errorStyle} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(FormCheckbox);
