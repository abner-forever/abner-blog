/**
 * NavLink 导航链接组件
 *
 * 简单的导航超链接，从 node.props 读取 NavLinkNodeProps
 */

import React from 'react';
import type { BaseComponentProps, NavLinkNodeProps } from '../types';

const LINK_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  color: '#1890ff',
  textDecoration: 'none',
  fontSize: 14,
  lineHeight: 1.6,
  cursor: 'pointer',
  transition: 'color 0.15s',
};

const NavLink: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as NavLinkNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { text, href = '#', target = '_self' } = props;

  return (
    <a
      id={node.props.id as string}
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      style={{ ...LINK_STYLE, ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#40a9ff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#1890ff';
      }}
    >
      {text || children || '导航链接'}
    </a>
  );
};

export default React.memo(NavLink);
