/**
 * Text 文本组件
 *
 * 根据 node.props.as 渲染为 h1-h6 / p / span
 * 内容从 node.props.content 读取
 * content 为空时显示占位文字
 */

import React from 'react';
import type { BaseComponentProps } from '../types';

const TAG_MAP: Record<string, keyof JSX.IntrinsicElements> = {
  h1: 'h1', h2: 'h2', h3: 'h3',
  h4: 'h4', h5: 'h5', h6: 'h6',
  p: 'p', span: 'span',
} as const;

const Text: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as { content?: string; as?: string };
  const style = node.props.style as React.CSSProperties | undefined;
  const className = node.props.className as string | undefined;

  const tag = (props.as && TAG_MAP[props.as]) || 'p';
  const Tag = tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';

  const content = props.content || undefined;

  return (
    <Tag
      id={node.props.id as string}
      className={className}
      style={style}
    >
      {content || children || '(空文本)'}
    </Tag>
  );
};

export default React.memo(Text);
