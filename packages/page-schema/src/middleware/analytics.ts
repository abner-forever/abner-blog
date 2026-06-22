/**
 * AnalyticsTracker 中间件
 *
 * 功能：
 * - 读取 node.props.analytics → 自动上报曝光和点击事件
 * - 通过工厂函数 `createAnalyticsMiddleware(tracker)` 注入追踪回调
 * - 曝光事件：组件渲染后立即上报（requestAnimationFrame）
 * - 点击事件：组件被点击时上报
 *
 * 用法（Schema 中设置 node.props）：
 * ```json
 * {
 *   "analytics": {
 *     "category": "banner",
 *     "action": "click",
 *     "label": "首页横幅"
 *   }
 * }
 * ```
 *
 * 集成（Web 端）：
 * ```tsx
 * const analyticsTracker = createAnalyticsMiddleware((event) => {
 *   console.log('[Analytics]', event);
 *   // 发送到数据平台：gtag, baidu, etc.
 * });
 *
 * <RendererProvider
 *   extraMiddlewares={[styleInjector, analyticsTracker]}
 * >
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 *
 * v1 实现：曝光 + 点击事件上报
 * 预留扩展：自定义维度、停留时间、滚动深度
 */

import React from 'react';
import type { SchemaNode, Middleware } from '../types';

/* ==================== 类型定义 ==================== */

export interface AnalyticsNodeProps {
  /** 事件分类（默认：组件 type） */
  category?: string;
  /** 事件动作（默认：view） */
  action?: string;
  /** 事件标签 */
  label?: string;
  /** 事件数值 */
  value?: number;
}

export interface AnalyticsEvent {
  /** 事件分类 */
  category: string;
  /** 事件动作 */
  action: string;
  /** 事件标签 */
  label?: string;
  /** 事件数值 */
  value?: number;
  /** 组件类型 */
  nodeType: string;
  /** 组件 ID */
  nodeId: string;
}

/** 追踪回调类型 */
export type AnalyticsTracker = (event: AnalyticsEvent) => void;

/* ==================== 中间件工厂 ==================== */

/**
 * 创建 Analytics 中间件
 *
 * @param tracker - 追踪回调，接收到事件后上报到分析平台
 * @returns Middleware
 */
export function createAnalyticsMiddleware(tracker: AnalyticsTracker): Middleware {
  return (node: SchemaNode, next) => {
    const analytics = node.props.analytics as AnalyticsNodeProps | undefined;
    const result = next(node);

    if (!analytics) return result;

    const category = analytics.category || node.type;
    const label = analytics.label;

    // 曝光事件：DOM 渲染后上报
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        tracker({
          category,
          action: 'impression',
          label,
          value: analytics.value,
          nodeType: node.type,
          nodeId: node.id,
        });
      });
    }

    // 如果渲染结果不是有效 React 元素，不再处理点击注入
    if (!React.isValidElement(result)) return result;

    // 点击事件注入
    const existingOnClick = (result.props as Record<string, unknown>).onClick as
      | ((e: React.MouseEvent) => void)
      | undefined;

    const action = analytics.action || 'click';
    if (action === 'click' || analytics.action) {
      const extraProps: Record<string, unknown> = {
        onClick: (e: React.MouseEvent) => {
          // 上报点击事件
          tracker({
            category,
            action: analytics.action || 'click',
            label,
            value: analytics.value,
            nodeType: node.type,
            nodeId: node.id,
          });
          // 调用原有的 onClick
          existingOnClick?.(e);
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.cloneElement(result as React.ReactElement<any>, extraProps);
    }

    return result;
  };
}
