/**
 * Accordion 手风琴/折叠面板组件
 *
 * 从 node.props.items 读取面板列表，支持多个面板同时展开
 * 子节点渲染在每个面板的内容区域
 */

import React, { useState } from 'react';
import type { BaseComponentProps, AccordionNodeProps } from '../types';

const PANEL_BORDER = '1px solid #e8e8e8';
const BASE_BG = '#fafafa';
const HOVER_BG = '#f0f0f0';
const ACTIVE_BG = '#e6f7ff';

const WRAPPER_STYLE: React.CSSProperties = {
  border: PANEL_BORDER,
  borderRadius: 6,
  overflow: 'hidden',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  cursor: 'pointer',
  userSelect: 'none',
  fontSize: 14,
  fontWeight: 500,
  color: '#333',
  background: BASE_BG,
  borderBottom: PANEL_BORDER,
  transition: 'background 0.15s',
};

const ARROW_STYLE: React.CSSProperties = {
  transition: 'transform 0.2s',
  fontSize: 12,
  color: '#999',
};

const CONTENT_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#555',
};

const Accordion: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as AccordionNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { items: rawItems } = props;
  const items = rawItems || [];

  // items 中各面板的展开状态
  const initialOpen = items.map((item) => !!item.defaultOpen);
  const [openState, setOpenState] = useState<boolean[]>(initialOpen);

  const togglePanel = (index: number) => {
    setOpenState((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  // 将 children 按 items 数量拆分
  const childrenArray = React.Children.toArray(children);

  return (
    <div id={node.props.id as string} style={{ ...WRAPPER_STYLE, ...style }}>
      {items.length === 0 && !children && (
        <div style={{ padding: 16, color: '#999', textAlign: 'center' }}>
          暂无面板内容
        </div>
      )}
      {items.map((item, index) => {
        const isOpen = openState[index] ?? false;
        return (
          <div key={index}>
            <div
              style={{
                ...HEADER_STYLE,
                background: isOpen ? ACTIVE_BG : BASE_BG,
              }}
              onClick={() => togglePanel(index)}
              onMouseEnter={(e) => {
                if (!isOpen) e.currentTarget.style.background = HOVER_BG;
              }}
              onMouseLeave={(e) => {
                if (!isOpen) e.currentTarget.style.background = BASE_BG;
              }}
            >
              <span>{item.title || `面板 ${index + 1}`}</span>
              <span style={{ ...ARROW_STYLE, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ▶
              </span>
            </div>
            {isOpen && (
              <div style={CONTENT_STYLE}>
                {childrenArray[index] || (
                  <span style={{ color: '#ccc' }}>面板内容</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(Accordion);
