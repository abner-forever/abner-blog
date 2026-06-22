/**
 * Image 图片组件
 *
 * 渲染 <img>，支持懒加载
 * src 为空时显示图片占位
 */

import React from 'react';
import type { BaseComponentProps, ImageNodeProps } from '../types';

const Image: React.FC<BaseComponentProps> = ({ node }) => {
  const { src, alt, lazy = true, width, height, objectFit } = node.props as ImageNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  // 空状态
  if (!src) {
    return (
      <div
        id={node.props.id as string}
        style={{
          width: width || '100%',
          height: height || 200,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 14,
          borderRadius: 4,
          ...style,
        }}
      >
        图片占位
      </div>
    );
  }

  return (
    <img
      id={node.props.id as string}
      src={src}
      alt={alt || ''}
      loading={lazy ? 'lazy' : undefined}
      width={width}
      height={height}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        objectFit,
        ...style,
      }}
    />
  );
};

export default React.memo(Image);
