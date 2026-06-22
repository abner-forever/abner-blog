/**
 * HtmlEmbed 自定义 HTML 嵌入组件
 *
 * 直接渲染 node.props.html 中的 HTML 字符串
 * 用于需要嵌入自定义 HTML/脚本/嵌入代码的场景
 */

import React from 'react';
import type { BaseComponentProps, HtmlEmbedNodeProps } from '../types';

const WRAPPER_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  overflow: 'auto',
};

const EMPTY_STYLE: React.CSSProperties = {
  padding: '20px 16px',
  textAlign: 'center',
  color: '#999',
  fontSize: 13,
  border: '1px dashed #d9d9d9',
  borderRadius: 4,
  background: '#fafafa',
};

const HtmlEmbed: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as HtmlEmbedNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { html } = props;

  if (!html) {
    return (
      <div id={node.props.id as string} style={{ ...EMPTY_STYLE, ...style }}>
        <div>嵌入内容为空</div>
        {children}
      </div>
    );
  }

  return (
    <div
      id={node.props.id as string}
      style={{ ...WRAPPER_STYLE, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default React.memo(HtmlEmbed);
