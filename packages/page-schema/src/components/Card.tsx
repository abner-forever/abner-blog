/**
 * Card 卡片组件
 *
 * 展示带图片、标题、描述和链接的卡片
 * 从 node.props 读取 CardNodeProps
 */

import React from 'react';
import type { BaseComponentProps, CardNodeProps } from '../types';

const CARD_STYLE: React.CSSProperties = {
  border: '1px solid #e8e8e8',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
  transition: 'box-shadow 0.2s',
};

const IMAGE_STYLE: React.CSSProperties = {
  width: '100%',
  height: 200,
  objectFit: 'cover',
  display: 'block',
};

const BODY_STYLE: React.CSSProperties = {
  padding: '12px 16px 16px',
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.5,
  margin: '0 0 8px',
  color: '#333',
};

const DESC_STYLE: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: '#666',
  margin: 0,
};

const Card: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as CardNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { imageSrc, imageAlt, title, description, href } = props;

  const cardContent = (
    <div id={node.props.id as string} style={{ ...CARD_STYLE, ...style }}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt || title || ''}
          style={IMAGE_STYLE}
          loading="lazy"
        />
      )}
      <div style={BODY_STYLE}>
        {title && <h3 style={TITLE_STYLE}>{title}</h3>}
        {description && <p style={DESC_STYLE}>{description}</p>}
        {children}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        id={node.props.id as string}
        href={href}
        style={{ textDecoration: 'none', display: 'block' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default React.memo(Card);
