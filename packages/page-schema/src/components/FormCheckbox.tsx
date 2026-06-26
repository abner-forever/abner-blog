/**
 * FormCheckbox 复选框组件
 *
 * 与 Form 容器的 FormContext 联动管理值状态
 */

import React, { useEffect, useId, useState } from 'react';
import type { BaseComponentProps, FormCheckboxNodeProps } from '../types';
import { useFormContext } from './Form';

const FormCheckbox: React.FC<BaseComponentProps> = ({ node }) => {
  const { label, name, required, value: propValue } =
    node.props as unknown as FormCheckboxNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;
  const formCtx = useFormContext();
  const id = useId();

  // 独立使用时的内部状态
  const [internalChecked, setInternalChecked] = useState(
    propValue === 'true' || propValue === '1',
  );

  useEffect(() => {
    if (formCtx && name) {
      formCtx.register({ name, required });
    }
  }, [formCtx, name, required]);

  // 当 props.value 变化时（变量绑定更新），同步到内部状态
  useEffect(() => {
    if (propValue !== undefined && !formCtx) {
      setInternalChecked(propValue === 'true' || propValue === '1');
    }
  }, [propValue, formCtx]);

  // 有 FormContext 时使用 FormContext 的值，否则使用内部状态
  const checked = formCtx ? !!(formCtx.values[name]) : internalChecked;
  const error = formCtx ? formCtx.errors[name] : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    if (formCtx) {
      formCtx.setValue(name, newValue);
    } else {
      setInternalChecked(newValue);
    }
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
