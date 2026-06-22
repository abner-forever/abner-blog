/**
 * Spacer 间距组件
 *
 * 渲染空白占位，高度由 node.props.height 控制
 * 用于在布局中插入垂直间距
 */

import React from 'react';
import type { BaseComponentProps, SpacerNodeProps } from '../types';

const Spacer: React.FC<BaseComponentProps> = ({ node }) => {
  const { height = 40 } = node.props as SpacerNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  return (
    <div
      id={node.props.id as string}
      style={{
        height,
        width: '100%',
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default React.memo(Spacer);
