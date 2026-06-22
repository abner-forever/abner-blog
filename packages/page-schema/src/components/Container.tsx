/**
 * Container 容器组件
 *
 * 自由布局容器，渲染为 <div>
 * 从 node.props.style 读布局样式，渲染 children
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

const Container: React.FC<BaseComponentProps> = ({ node, children }) => {
  const style = node.props.style as React.CSSProperties | undefined;

  return (
    <div
      id={node.props.id as string}
      style={style}
    >
      {children}
    </div>
  );
};

export default React.memo(Container);
