/**
 * DataBadge 数据徽标组件
 *
 * 显示计数徽标，支持：
 * 1. 静态模式（count + text）
 * 2. API 模式（api）：从端点获取最新计数
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { BaseComponentProps, DataBadgeNodeProps } from '../types';

const DataBadge: React.FC<BaseComponentProps> = ({ node }) => {
  const { count: initialCount, api, text = '', maxCount = 999 } =
    node.props as DataBadgeNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const [count, setCount] = useState<number>(initialCount ?? 0);
  const [loading, setLoading] = useState(!!api);
  const [error, setError] = useState<string | null>(null);

  const isApiMode = !!api;

  /** 从 API 获取计数 */
  const fetchCount = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(api);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      // 兼容多种响应格式
      const value: number =
        result.count ??
        result.data?.count ??
        result.total ??
        result.value ??
        result;

      if (typeof value === 'number') {
        setCount(value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isApiMode) {
      fetchCount();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 格式化计数显示 */
  const displayCount =
    count > maxCount
      ? `${maxCount}+`
      : count >= 10000
        ? `${(count / 10000).toFixed(1)}w`
        : String(count);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 14,
    ...style,
  };

  /* ====== Error 状态 ====== */
  if (error) {
    return (
      <div
        id={node.props.id as string}
        style={{
          ...containerStyle,
          color: '#999',
        }}
        title={error}
      >
        <span>{text || '数据'}</span>
        <span
          style={{
            background: '#f5f5f5',
            color: '#bbb',
            borderRadius: 10,
            padding: '1px 8px',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          —
        </span>
      </div>
    );
  }

  return (
    <div id={node.props.id as string} style={containerStyle} data-badge>
      {/* 文字 */}
      {text && (
        <span style={{ color: '#666', lineHeight: 1 }}>{text}</span>
      )}

      {/* 计数徽标 */}
      <span
        style={{
          background: loading ? '#e8e8e8' : '#1890ff',
          color: '#fff',
          borderRadius: 10,
          padding: '2px 8px',
          fontSize: 12,
          fontWeight: 500,
          lineHeight: '18px',
          transition: 'background 0.2s',
          minWidth: 20,
          textAlign: 'center',
        }}
      >
        {loading ? '…' : displayCount}
      </span>
    </div>
  );
};

export default React.memo(DataBadge);
