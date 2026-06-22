/**
 * Section 区块组件
 *
 * 渲染为 <section>，用于页面分块
 * 默认 padding: 40px 20px, minHeight: 100px
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

const Section: React.FC<BaseComponentProps> = ({ node, children }) => {
  const style = node.props.style as React.CSSProperties | undefined;

  return (
    <section
      id={node.props.id as string}
      style={style}
    >
      {children}
    </section>
  );
};

export default React.memo(Section);
