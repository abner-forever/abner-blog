/**
 * Row 行组件
 *
 * 渲染为 <div>，display: flex; flex-wrap: wrap
 * 用于水平排列子元素（通常包含 Column 子组件）
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

const Row: React.FC<BaseComponentProps> = ({ node, children }) => {
  const style = node.props.style as React.CSSProperties | undefined;

  return (
    <div
      id={node.props.id as string}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default React.memo(Row);
