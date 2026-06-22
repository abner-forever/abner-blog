/**
 * Form 表单容器组件
 *
 * 支持双模式：
 * 1. 原生模式（action/method）：标准 HTML 表单提交
 * 2. API 模式（api）：通过 fetch 发送 POST 请求
 *
 * 通过 React Context 与子表单字段组件通信，管理表单状态。
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { BaseComponentProps, FormNodeProps } from '../types';

/* ==================== FormContext ==================== */

interface FormField {
  name: string;
  required?: boolean;
}

interface FormContextValue {
  /** 所有表单字段值 */
  values: Record<string, unknown>;
  /** 更新字段值 */
  setValue: (name: string, value: unknown) => void;
  /** 注册字段（name + required） */
  register: (field: FormField) => void;
  /** 字段错误映射 */
  errors: Record<string, string>;
  /** 设置字段错误 */
  setError: (name: string, error: string) => void;
  /** 表单是否正在提交 */
  submitting: boolean;
  /** 表单是否已提交成功 */
  submitted: boolean;
  /** 触发提交 */
  submit: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext(): FormContextValue | null {
  return useContext(FormContext);
}

/* ==================== Form 组件 ==================== */

const Form: React.FC<BaseComponentProps> = ({ node, children }) => {
  const { action, method = 'POST', api, successMessage = '提交成功', errorMessage = '提交失败' } =
    node.props as FormNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const nativeFormRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fieldsRef = useRef<FormField[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const isApiMode = !!api;

  const register = useCallback((field: FormField) => {
    fieldsRef.current = fieldsRef.current.filter((f) => f.name !== field.name);
    fieldsRef.current.push(field);
  }, []);

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  /** 简单校验 */
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let valid = true;

    fieldsRef.current.forEach((field) => {
      const value = values[field.name];
      if (field.required && (value === undefined || value === '' || value === null)) {
        newErrors[field.name] = '此项为必填';
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  }, [values]);

  /** 提交处理 */
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setGlobalError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isApiMode) {
        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.message || errorMessage);
        }
      } else {
        // 原生模式：直接调用表单 submit
        nativeFormRef.current?.submit();
      }

      setSubmitted(true);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, validate, isApiMode, api, values, errorMessage]);

  const formContextValue: FormContextValue = {
    values,
    setValue,
    register,
    errors,
    setError,
    submitting,
    submitted,
    submit: handleSubmit,
  };

  const containerStyle: React.CSSProperties = {
    padding: 24,
    borderRadius: 8,
    maxWidth: '100%',
    ...style,
  };

  return (
    <FormContext.Provider value={formContextValue}>
      {isApiMode ? (
        <div id={node.props.id as string} style={containerStyle} data-form-container>
          {children}

          {globalError && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 4,
                color: '#ff4d4f',
                fontSize: 13,
              }}
            >
              {globalError}
            </div>
          )}

          {submitted && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
                color: '#52c41a',
                fontSize: 13,
              }}
            >
              {successMessage}
            </div>
          )}
        </div>
      ) : (
        <form
          id={node.props.id as string}
          ref={nativeFormRef}
          action={action}
          method={method}
          style={containerStyle}
          data-form-container
          onSubmit={(e) => {
            if (!action) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        >
          {children}

          {submitted && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 12px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 4,
                color: '#52c41a',
                fontSize: 13,
              }}
            >
              {successMessage}
            </div>
          )}
        </form>
      )}
    </FormContext.Provider>
  );
};

export default React.memo(Form);
