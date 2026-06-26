/**
 * PageRenderer — 页面渲染器
 *
 * 核心递归渲染引擎，接收 SchemaNode 树，通过中间件链处理后
 * 从 ComponentRegistry 查找对应组件并渲染。
 *
 * 架构：
 * PageRenderer
 *   ├── Loading 状态 → 加载动画
 *   ├── Error 状态 → 错误提示
 *   ├── Empty 状态 → 空占位
 *   └── 正常渲染
 *       ├── 注入全局 <style>{css}</style>
 *       └── renderNode(root)
 *           ├── hidden = true → 跳过
 *           ├── 中间件链处理
 *           ├── registry.get(type) → 找到组件
 *           │   ├── 找到 → 组件(node, children)
 *           │   └── 未找到 → UnknownComponent
 *           └── 递归 renderNode(children)
 */

import React, { Suspense, useMemo } from 'react';
import type { PageSchema, SchemaNode } from './types';
import { useRendererContext } from './provider';
import { applyMiddlewares } from './middleware/types';
import { createEventHandler } from './middleware/event-handler';
import { UnknownComponent } from './components/Unknown';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useVariableSubscription, extractNodeVariableDeps } from './variable-store';

/* ==================== 状态组件 ==================== */

/** 加载中状态 */
const RendererLoading: React.FC = () => (
  <div
    style={{
      height: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        border: '3px solid #f0f0f0',
        borderTopColor: '#1890ff',
        borderRadius: '50%',
        animation: 'page-renderer-spin 0.8s linear infinite',
      }}
    />
    <style>{`@keyframes page-renderer-spin { to { transform: rotate(360deg); } }`}</style>
    <span style={{ color: '#999', fontSize: 14 }}>页面加载中…</span>
  </div>
);

/** 空状态 */
const RendererEmpty: React.FC = () => (
  <div
    style={{
      height: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}
  >
    <div style={{ fontSize: 48 }}>📄</div>
    <div style={{ color: '#999', fontSize: 14 }}>页面暂无内容</div>
  </div>
);

/** 错误状态 */
const RendererError: React.FC<{ message?: string }> = ({ message }) => (
  <div
    style={{
      height: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    }}
  >
    <div style={{ fontSize: 48 }}>⚠️</div>
    <div style={{ color: '#999', fontSize: 14 }}>
      {message || '页面渲染异常'}
    </div>
  </div>
);

/* ==================== 节点渲染器 ==================== */

interface RenderNodeProps {
  node: SchemaNode;
  depth: number;
}

/**
 * 递归渲染 SchemaNode 树
 *
 * 处理逻辑：
 * 1. hidden 节点跳过
 * 2. 通过 applyMiddlewares + renderComponent 让中间件链处理渲染
 *    - renderComponent 是中间件链末端的 identity 函数，产生真实 React 元素
 *    - 前面的中间件（eventHandler、styleInjector）通过 next() 拿到该元素后
 *      用 cloneElement 注入额外属性（事件监听、样式等）
 * 3. 中间件返回 null → 跳过渲染
 */
const RenderNode: React.FC<RenderNodeProps> = ({ node, depth }) => {
  const { registry, middlewares, actionContext } = useRendererContext();

  // Hooks 必须在条件返回前统一调用（React Rules of Hooks）
  // ========== 变量订阅：按需重渲染 ==========
  const varDeps = useMemo(() => extractNodeVariableDeps(node.props), [node]);
  const varSnapshot = useVariableSubscription(varDeps);

  const memoKey = useMemo(
    () => `${node.id || node.type}_${depth}_${varSnapshot}`,
    [node, depth, varSnapshot],
  );

  const allMiddlewares = useMemo(() => {
    if (!actionContext) return middlewares;
    return [createEventHandler(actionContext), ...middlewares];
  }, [middlewares, actionContext]);

  // 条件跳过（放在 hooks 之后，避免破坏 hooks 调用顺序）
  if (node.hidden) return null;
  if (node.type === 'modal') return null;

  // 创建组件渲染函数（中间件链末端 identity，产生真实 React 元素）
  const renderComponent = (n: SchemaNode): React.ReactNode => {
    const children = n.children?.map((child) => (
      <RenderNode key={child.id} node={child} depth={depth + 1} />
    ));
    const Component = registry.get(n.type);
    if (!Component) {
      return <UnknownComponent node={n}>{children}</UnknownComponent>;
    }
    return <Component node={n}>{children}</Component>;
  };

  // 缓存中间件链结果：仅当依赖的变量或节点结构变化时才重执行
  const middlewareResult = useMemo(
    () => applyMiddlewares(node, allMiddlewares, renderComponent),
    [memoKey, node, allMiddlewares],
  );

  if (middlewareResult === null) return null;
  return middlewareResult;
};

/* ==================== 主渲染器 ==================== */

export interface PageRendererProps {
  /** 页面 Schema JSON（可选，与 node 二选一） */
  schema?: PageSchema | null;
  /** 直接传入 root SchemaNode（可选，简化用法） */
  node?: SchemaNode | null;
  /** 加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
}

/**
 * 页面渲染器入口组件
 *
 * 接收页面 Schema JSON 或根节点，递归遍历组件树并渲染。
 * 必须在 <RendererProvider> 内部使用。
 *
 * 用法：
 * ```tsx
 * <RendererProvider schema={pageSchema}>
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 */
export const PageRenderer: React.FC<PageRendererProps> = ({
  schema,
  node,
  loading = false,
  error = null,
}) => {
  const { css } = useRendererContext();

  // 加载中
  if (loading) {
    return <RendererLoading />;
  }

  // 错误状态
  if (error) {
    return <RendererError message={error} />;
  }

  // 确定根节点：优先直接传入的 node，其次 schema.root
  const rootNode = node || schema?.root;

  // 空状态
  if (!rootNode) {
    return <RendererEmpty />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<RendererLoading />}>
        {/* 全局 CSS */}
        {css && <style>{css}</style>}
        <RenderNode node={rootNode} depth={0} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default PageRenderer;
