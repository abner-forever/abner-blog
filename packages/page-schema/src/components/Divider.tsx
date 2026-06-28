/**
 * Divider 分割线组件
 *
 * 渲染分割线，支持 color / height / style 配置
 * 默认渲染为带样式的 <hr>
 */

import React from 'react';
import type { BaseComponentProps, DividerNodeProps } from '../types';

const Divider: React.FC<BaseComponentProps> = ({ node }) => {
  const { color = '#e8e8e8', height = 1, style: lineStyle = 'solid' } = node.props as unknown as DividerNodeProps;

  return (
    <div
      id={node.props.id as string}
      style={{
        width: '100%',
        padding: '10px 0',
      }}
    >
      <hr
        style={{
          border: 'none',
          borderTop: `${height}px ${lineStyle} ${color}`,
          margin: 0,
        }}
      />
    </div>
  );
};

export default React.memo(Divider);
