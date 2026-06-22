/**
 * ErrorBoundary 错误边界
 *
 * 用于捕获 React 组件渲染过程中的未预期错误，
 * 防止整个页面崩溃，展示优雅的降级 UI。
 *
 * 在 PageRenderer 中使用：
 * - 外层 ErrorBoundary 包裹整个渲染树（防止页面整体崩溃）
 * - 技术上也可以在每个节点上使用（但会增加复杂度，v1 只在顶层使用）
 *
 * v1 实现：捕获错误后显示降级提示，保留页面其它部分正常渲染
 * 预留扩展：错误日志上报、错误恢复、逐个组件隔离
 */

import React from 'react';

/* ==================== 类型定义 ==================== */

interface ErrorBoundaryProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 自定义降级 UI */
  fallback?: React.ReactNode;
  /** 错误回调（用于日志上报） */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* ==================== 默认降级 UI ==================== */

const DefaultFallback: React.FC<{ error: Error | null }> = ({ error }) => (
  <div
    style={{
      padding: 24,
      margin: 16,
      border: '1px solid #ffccc7',
      borderRadius: 6,
      background: '#fff2f0',
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 500, color: '#cf1322', marginBottom: 8 }}>
      ⚠️ 组件渲染异常
    </div>
    <div style={{ fontSize: 13, color: '#666' }}>
      {error?.message || '未知错误'}
    </div>
  </div>
);

/* ==================== ErrorBoundary 组件 ==================== */

/**
 * 错误边界组件
 *
 * 捕获子组件树中的 React 渲染错误，防止崩溃扩散。
 *
 * 用法：
 * ```tsx
 * <ErrorBoundary>
 *   <PageRenderer />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
