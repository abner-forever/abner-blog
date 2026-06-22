/**
 * DataList 数据列表组件
 *
 * 支持双模式：
 * 1. 静态模式（items）：直接从 props 渲染数据条目
 * 2. API 模式（api）：从 API 端点获取数据并渲染
 *
 * 通过 fieldMapping 实现数据字段到模板变量的映射。
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { BaseComponentProps, DataListNodeProps } from '../types';

/** 数据条目默认渲染函数 */
function renderDefaultItem(item: Record<string, unknown>, index: number): React.ReactNode {
  const title = (item.title || item.name || item.label || `条目 ${index + 1}`) as string;
  const description = (item.description || item.desc || item.summary || '') as string;
  const image = (item.image || item.cover || item.thumbnail || '') as string;

  return (
    <div
      key={index}
      style={{
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 6,
        border: '1px solid #e8e8e8',
        display: 'flex',
        gap: 12,
        alignItems: image ? 'flex-start' : 'center',
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          style={{
            width: 60,
            height: 60,
            borderRadius: 4,
            objectFit: 'cover',
            flexShrink: 0,
          }}
          loading="lazy"
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: '#333', marginBottom: 4 }}>
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 13,
              color: '#666',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

/** 使用 fieldMapping 渲染条目 */
function renderMappedItem(
  item: Record<string, unknown>,
  mapping: Record<string, string>,
  index: number,
): React.ReactNode {
  const fields: Record<string, React.ReactNode> = {};
  for (const [key, fieldPath] of Object.entries(mapping)) {
    fields[key] = String(item[fieldPath] ?? '');
  }

  // 尝试渲染映射后的结构
  return (
    <div
      key={index}
      style={{
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 6,
        border: '1px solid #e8e8e8',
      }}
    >
      {Object.entries(fields).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 4, fontSize: 13, color: '#555' }}>
          <span style={{ fontWeight: 500, marginRight: 8 }}>{key}:</span>
          {value}
        </div>
      ))}
    </div>
  );
}

/**
 * LazyItem — 使用 IntersectionObserver 实现懒加载渲染
 *
 * 仅在元素进入视口附近时渲染内容，减少首次渲染 DOM 节点数。
 * rootMargin 设置为 200px，在元素进入视口前 200px 开始渲染。
 */
const LazyItem: React.FC<{
  renderFn: () => React.ReactNode;
  placeholderHeight?: number;
}> = ({ renderFn, placeholderHeight = 80 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el); // 一次渲染后即停止观察
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ minHeight: visible ? undefined : placeholderHeight }}
    >
      {visible ? renderFn() : null}
    </div>
  );
};

const DataList: React.FC<BaseComponentProps> = ({ node }) => {
  const { items: staticItems, api, method = 'GET', pageSize = 10, fieldMapping } =
    node.props as DataListNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  const [items, setItems] = useState<Array<Record<string, unknown>>>(staticItems || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(staticItems?.length || 0);

  const isApiMode = !!api;

  /** 从 API 加载数据 */
  const fetchData = useCallback(
    async (pageNum: number) => {
      if (!api) return;
      setLoading(true);
      setError(null);

      try {
        const url = method === 'GET'
          ? `${api}${api.includes('?') ? '&' : '?'}page=${pageNum}&pageSize=${pageSize}`
          : api;

        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(method === 'POST' ? { body: JSON.stringify({ page: pageNum, pageSize }) } : {}),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        // 尝试解析不同格式的响应
        const dataList: Array<Record<string, unknown>> =
          result.list ||
          result.data?.list ||
          result.data?.items ||
          result.data ||
          result.items ||
          [];

        if (pageNum === 1) {
          setItems(dataList);
        } else {
          setItems((prev) => [...prev, ...dataList]);
        }

        setTotalItems(
          result.total ||
            result.data?.total ||
            result.data?.count ||
            dataList.length,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    },
    [api, method, pageSize],
  );

  /** 初始加载 */
  useEffect(() => {
    if (isApiMode) {
      fetchData(1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 加载更多 */
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage);
  };

  const hasMore = isApiMode && items.length < totalItems;
  const isEmpty = !loading && items.length === 0;

  const containerStyle: React.CSSProperties = {
    padding: 20,
    borderRadius: 8,
    ...style,
  };

  /* ====== Loading 状态 ====== */
  if (loading && items.length === 0) {
    return (
      <div
        id={node.props.id as string}
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '40px 20px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            border: '2px solid #e8e8e8',
            borderTopColor: '#1890ff',
            borderRadius: '50%',
            animation: 'formSpin 0.6s linear infinite',
          }}
        />
        <span style={{ color: '#999', fontSize: 14 }}>加载中…</span>
      </div>
    );
  }

  /* ====== Error 状态 ====== */
  if (error && items.length === 0) {
    return (
      <div
        id={node.props.id as string}
        style={{
          ...containerStyle,
          textAlign: 'center',
          padding: '40px 20px',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
        <div style={{ color: '#ff4d4f', fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  /* ====== Empty 状态 ====== */
  if (isEmpty) {
    return (
      <div
        id={node.props.id as string}
        style={{
          ...containerStyle,
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
        <div style={{ fontSize: 14 }}>暂无数据</div>
      </div>
    );
  }

  /* ====== 正常渲染 ====== */
  return (
    <div id={node.props.id as string} style={containerStyle} data-datalist>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.map((item, index) => (
          <LazyItem
            key={index}
            renderFn={() =>
              fieldMapping
                ? renderMappedItem(item, fieldMapping, index)
                : renderDefaultItem(item, index)
            }
            placeholderHeight={fieldMapping ? 44 : 80}
          />
        ))}
      </div>

      {/* 加载更多 */}
      {isApiMode && hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            style={{
              padding: '8px 24px',
              background: loading ? '#f5f5f5' : '#fff',
              color: loading ? '#999' : '#1890ff',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '加载中…' : '加载更多'}
          </button>
        </div>
      )}

      {/* 已加载全部 */}
      {isApiMode && !hasMore && items.length > 0 && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            color: '#bbb',
            fontSize: 13,
            padding: '8px 0',
          }}
        >
          — 已加载全部 {totalItems} 条 —
        </div>
      )}
    </div>
  );
};

export default React.memo(DataList);
