/**
 * StyleInjector 中间件
 *
 * 功能：
 * - 读取 node.props.style → 转为内联样式
 * - 读取 node.props.className → 追加 className
 * - 通过 cloneElement 注入到渲染结果
 *
 * v1 实现：仅处理内联 style 和 className
 * 预留扩展：响应式样式、CSS 变量注入
 */

import React from 'react';
import type { SchemaNode, Middleware } from '../types';

/**
 * StyleInjector 中间件
 *
 * 将 node.props.style 和 node.props.className 注入到
 * 下一个中间件或组件的渲染结果中。
 */
export const styleInjector: Middleware = (node: SchemaNode, next) => {
  const result = next(node);

  // null 表示跳过渲染
  if (result === null) return null;

  // 透传标记：还没到组件渲染阶段
  if (!React.isValidElement(result)) return result;

  const style = node.props.style as React.CSSProperties | undefined;
  const className = node.props.className as string | undefined;

  // 没有需要注入的内容
  if (!style && !className) return result;

  // 使用 Record<string, unknown> 避免类型冲突，cloneElement 接受宽泛的 props
  const extraProps: Record<string, unknown> = {};

  if (style) {
    const resultStyle = (result.props as Record<string, unknown>).style as
      | React.CSSProperties
      | undefined;
    extraProps.style = { ...style, ...resultStyle };
  }

  if (className) {
    const existingClassName = (result.props as Record<string, unknown>)
      .className as string | undefined;
    extraProps.className =
      [className, existingClassName].filter(Boolean).join(' ') || undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.cloneElement(result as React.ReactElement<any>, extraProps);
};
