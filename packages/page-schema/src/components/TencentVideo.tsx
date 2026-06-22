/**
 * TencentVideo 腾讯视频组件
 *
 * 嵌入腾讯视频 iframe 播放器
 * 从 node.props.vid 构建 iframe URL
 */

import React from 'react';
import type { BaseComponentProps, TencentVideoNodeProps } from '../types';

const TencentVideo: React.FC<BaseComponentProps> = ({ node }) => {
  const { vid, width = '100%', height } = node.props as TencentVideoNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  if (!vid) {
    return (
      <div
        id={node.props.id as string}
        style={{
          width: '100%',
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
        腾讯视频占位（无 VID）
      </div>
    );
  }

  const iframeSrc = `https://v.qq.com/txp/iframe/player.html?vid=${vid}`;
  const paddingBottom = height ? undefined : '56.25%';

  return (
    <div
      id={node.props.id as string}
      style={{
        position: height ? 'static' : 'relative',
        width: width || '100%',
        ...(paddingBottom ? { paddingBottom } : { height }),
        ...style,
      }}
    >
      <iframe
        src={iframeSrc}
        style={{
          position: height ? 'static' : 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: height || '100%',
          border: 'none',
        }}
        allowFullScreen
        loading="lazy"
        title="腾讯视频"
      />
    </div>
  );
};

export default React.memo(TencentVideo);
