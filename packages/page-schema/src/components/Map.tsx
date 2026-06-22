/**
 * Map 地图组件（iframe 嵌入）
 *
 * 通过 iframe 嵌入地图（高德/百度/Google Maps 等）
 * 从 node.props 读取 MapNodeProps
 */

import React from 'react';
import type { BaseComponentProps, MapNodeProps } from '../types';

const WRAPPER_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  borderRadius: 8,
};

const IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
};

const EMPTY_STYLE: React.CSSProperties = {
  width: '100%',
  height: 300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fafafa',
  color: '#999',
  fontSize: 14,
  borderRadius: 8,
  gap: 8,
};

const Map: React.FC<BaseComponentProps> = ({ node, children }) => {
  const props = node.props as MapNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const { src, width: propWidth, height: propHeight, address } = props;

  const mapWidth = propWidth || '100%';
  const mapHeight = propHeight || '360px';

  if (!src && !address) {
    return (
      <div id={node.props.id as string} style={{ ...EMPTY_STYLE, ...style }}>
        <div style={{ fontSize: 32 }}>🗺️</div>
        <span>暂无地图配置</span>
        {children}
      </div>
    );
  }

  // 如果有 address 但没有 src，生成一个占位
  const iframeSrc = src || `https://uri.amap.com/marker?position=&name=${encodeURIComponent(address || '')}`;

  return (
    <div
      id={node.props.id as string}
      style={{
        width: mapWidth,
        height: mapHeight,
        ...style,
      }}
    >
      <iframe
        src={iframeSrc}
        title="map"
        style={IFRAME_STYLE}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
      {children}
    </div>
  );
};

export default React.memo(Map);
