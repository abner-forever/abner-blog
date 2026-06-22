/**
 * NavMenu 导航菜单组件
 *
 * 水平导航菜单，支持粘性定位
 * 从 node.props.items 读取菜单项
 */

import React, { useState } from 'react';
import type { BaseComponentProps, NavMenuNodeProps } from '../types';

const MENU_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 16px',
  height: 48,
  background: '#fff',
  borderBottom: '1px solid #e8e8e8',
  listStyle: 'none',
  margin: 0,
};

const LINK_STYLE: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 14px',
  fontSize: 14,
  color: '#555',
  textDecoration: 'none',
  borderRadius: 4,
  transition: 'background 0.15s, color 0.15s',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const LINK_HOVER_STYLE: React.CSSProperties = {
  background: '#f0f5ff',
  color: '#1890ff',
};

const LINK_ACTIVE_STYLE: React.CSSProperties = {
  color: '#1890ff',
  fontWeight: 500,
};

const MOBILE_TOGGLE_STYLE: React.CSSProperties = {
  display: 'none',
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 20,
  background: 'none',
  border: 'none',
  color: '#555',
};

const NavMenu: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as NavMenuNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { sticky, items: rawItems } = props;
  const items = rawItems || [];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <nav
      id={node.props.id as string}
      style={{
        ...(sticky ? { position: 'sticky', top: 0, zIndex: 100 } : {}),
        background: '#fff',
        ...style,
      }}
    >
      {/* Mobile toggle */}
      <button
        style={MOBILE_TOGGLE_STYLE}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <ul
        style={{
          ...MENU_STYLE,
          flexDirection: isMobile && mobileOpen ? 'column' : 'row',
          height: isMobile && mobileOpen ? 'auto' : 48,
          padding: isMobile && mobileOpen ? '8px 16px' : '0 16px',
        }}
      >
        {items.length === 0 && (
          <li style={{ color: '#ccc', fontSize: 13, padding: '6px 0' }}>
            暂无菜单项
          </li>
        )}
        {items.map((item, index) => (
          <li key={index} style={{ listStyle: 'none' }}>
            <a
              href={item.href || '#'}
              target={item.target || '_self'}
              rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
              style={{
                ...LINK_STYLE,
                ...(index === activeIndex ? LINK_ACTIVE_STYLE : {}),
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, LINK_HOVER_STYLE);
              }}
              onMouseLeave={(e) => {
                if (index !== activeIndex) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#555';
                }
              }}
              onClick={() => setActiveIndex(index)}
            >
              {item.label || `菜单 ${index + 1}`}
            </a>
          </li>
        ))}
        {children}
      </ul>
    </nav>
  );
};

export default React.memo(NavMenu);
