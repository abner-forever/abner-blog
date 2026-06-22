/**
 * Button 按钮组件
 *
 * 渲染 <button> 或 <a>（有 href 时）
 * 支持 variant 样式：primary / default / text / link
 */

import React from 'react';
import type { BaseComponentProps, ButtonNodeProps } from '../types';

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  primary: {
    background: '#1890ff',
    color: '#fff',
    border: 'none',
  },
  default: {
    background: '#fff',
    color: '#333',
    border: '1px solid #d9d9d9',
  },
  text: {
    background: 'transparent',
    color: '#1890ff',
    border: 'none',
  },
  link: {
    background: 'transparent',
    color: '#1890ff',
    border: 'none',
    padding: 0,
    textDecoration: 'underline',
  },
};

const Button: React.FC<BaseComponentProps> = ({ node, children }) => {
  const { text, variant = 'primary', loading } = node.props as ButtonNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const label = text || children || '按钮';
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: variant === 'link' ? 0 : '10px 24px',
    borderRadius: variant === 'link' ? 0 : 4,
    fontSize: 14,
    cursor: loading ? 'wait' : 'pointer',
    textDecoration: 'none',
    lineHeight: 1.4,
    opacity: loading ? 0.7 : 1,
    ...variantStyle,
    ...style,
  };

  return (
    <button
      id={node.props.id as string}
      type="button"
      style={baseStyle}
      disabled={loading}
    >
      {loading ? '加载中…' : label}
    </button>
  );
};

export default React.memo(Button);
