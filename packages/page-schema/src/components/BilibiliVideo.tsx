/**
 * BilibiliVideo B站视频组件
 *
 * 嵌入 B站 iframe 播放器
 * 从 node.props.bvid 构建 iframe URL
 */

import React from 'react';
import type { BaseComponentProps, BilibiliVideoNodeProps } from '../types';

const BilibiliVideo: React.FC<BaseComponentProps> = ({ node }) => {
  const { bvid, page = 1, width = '100%', height } = node.props as BilibiliVideoNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  if (!bvid) {
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
        B站视频占位（无 BV 号）
      </div>
    );
  }

  const iframeSrc = `//player.bilibili.com/player.html?bvid=${bvid}&page=${page}`;
  const paddingBottom = height ? undefined : '56.25%';

  return (
    <div
      id={node.props.id as string}
      style={{
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
        title="B站视频"
      />
    </div>
  );
};

export default React.memo(BilibiliVideo);
