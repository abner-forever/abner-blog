/**
 * Video 视频组件
 *
 * 渲染 <video>（本地视频）或 <iframe>（嵌入视频）
 * 支持 controls / autoplay / loop / muted
 * src 为空时显示视频占位
 */

import React from 'react';
import type { BaseComponentProps, VideoNodeProps } from '../types';

const Video: React.FC<BaseComponentProps> = ({ node }) => {
  const { src, poster, controls = true, autoplay = false, loop = false, muted = false } = node.props as VideoNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  // 空状态
  if (!src) {
    return (
      <div
        id={node.props.id as string}
        style={{
          width: '100%',
          height: 300,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 14,
          borderRadius: 4,
          ...style,
        }}
      >
        视频占位
      </div>
    );
  }

  // iframe 嵌入
  if (src.includes('youtube.com') || src.includes('player.')) {
    return (
      <div
        id={node.props.id as string}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '56.25%',
          ...style,
        }}
      >
        <iframe
          src={src}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allowFullScreen
          loading="lazy"
          title="视频播放器"
        />
      </div>
    );
  }

  // 原生 video
  return (
    <video
      id={node.props.id as string}
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoplay}
      loop={loop}
      muted={muted}
      style={{
        maxWidth: '100%',
        display: 'block',
        ...style,
      }}
    />
  );
};

export default React.memo(Video);
