/**
 * Tabs 标签页组件
 *
 * 从 node.props.tabLabels 读取标签名列表，从 children 读取各面板内容
 * 支持 activeIndex 控制初始选中
 */

import React, { useState } from 'react';
import type { BaseComponentProps, TabsNodeProps } from '../types';

const WRAPPER_STYLE: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: 6,
  overflow: 'hidden',
};

const TAB_BAR_STYLE: React.CSSProperties = {
  display: 'flex',
  borderBottom: '2px solid #e8e8e8',
  background: '#fafafa',
};

const TAB_ITEM_STYLE: React.CSSProperties = {
  padding: '10px 20px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  color: '#666',
  borderBottom: '2px solid transparent',
  marginBottom: -2,
  transition: 'color 0.15s, border-color 0.15s',
  userSelect: 'none',
};

const TAB_ACTIVE_STYLE: React.CSSProperties = {
  color: '#1890ff',
  borderBottomColor: '#1890ff',
  background: '#fff',
};

const CONTENT_STYLE: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#555',
  minHeight: 60,
};

const Tabs: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as TabsNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { tabLabels: rawLabels, activeIndex: defaultIndex } = props;
  const labels = rawLabels || ['标签 1', '标签 2'];
  const [activeIndex, setActiveIndex] = useState(Math.max(0, defaultIndex ?? 0));

  const childrenArray = React.Children.toArray(children);

  return (
    <div id={node.props.id as string} style={{ ...WRAPPER_STYLE, ...style }}>
      <div style={TAB_BAR_STYLE}>
        {labels.map((label, index) => (
          <div
            key={index}
            style={{
              ...TAB_ITEM_STYLE,
              ...(index === activeIndex ? TAB_ACTIVE_STYLE : {}),
            }}
            onClick={() => setActiveIndex(index)}
          >
            {label}
          </div>
        ))}
      </div>
      <div style={CONTENT_STYLE}>
        {childrenArray[activeIndex] || (
          <span style={{ color: '#ccc' }}>标签页内容</span>
        )}
      </div>
    </div>
  );
};

export default React.memo(Tabs);
