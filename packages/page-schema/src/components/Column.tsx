/**
 * Column 列组件
 *
 * 渲染为 <div>，flex: 1; min-width: 200px
 * 通常作为 Row 的子组件使用
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

const Column: React.FC<BaseComponentProps> = ({ node, children }) => {
  const style = node.props.style as React.CSSProperties | undefined;

  return (
    <div
      id={node.props.id as string}
      style={{
        flex: 1,
        minWidth: 200,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default React.memo(Column);
