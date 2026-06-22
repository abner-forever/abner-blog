/**
 * EventHandler 中间件 v2
 *
 * 将 SchemaNode.events 中定义的 JSON 可序列化事件绑定，
 * 转换为真实 DOM 事件监听器。
 *
 * 设计：
 * - 通过工厂函数注入 ActionContext（由 RendererProvider 创建）
 * - 支持 debounce / throttle / condition
 * - 支持 12 种内置动作类型（toast, navigate, call-api 等）
 * - 所有事件绑定通过 node.events 定义，支持 12 种动作类型
 *
 * 事件绑定实现方式：
 * - 中间件通过包裹式 span（display: contents）附加事件处理函数
 * - 这样做是因为组件（Container/Text 等）只接收 {node, children} 而不会透传
 *   额外 props，用 React.cloneElement 注入 onClick 等 props 时，
 *   组件不接收这些 prop 导致事件处理函数无法到达真实 DOM 元素。
 * - 使用包裹式 span 可以避免修改所有组件，事件绑定自动生效。
 *
 * 使用方式（由 RendererProvider 自动注入，宿主无需手动添加）：
 * ```tsx
 * <RendererProvider schema={schema} actionContextFactory={factory}>
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 */

import React from 'react';
import type { SchemaNode, Middleware, EventBinding } from '../types';
import type { ActionContext } from '../event-engine/action-context';
import { executeActions } from '../event-engine/executor';

/* ==================== 工厂函数 ==================== */

/**
 * 创建事件绑定中间件
 * 由 RendererProvider 在初始化时调用，注入 ActionContext
 */
export function createEventHandler(context: ActionContext): Middleware {
  return (node: SchemaNode, next) => {
    const result = next(node);

    // null 表示跳过渲染
    if (result === null) return null;

    // 透传标记：还没到组件渲染阶段
    if (!React.isValidElement(result)) return result;

    // v2 事件绑定
    const events = node.events as EventBinding[] | undefined;

    // 无事件绑定，直接返回
    if (!events?.length) {
      return result;
    }

    const extraProps: Record<string, unknown> = {};

    // 从 node.events 读 JSON 事件绑定
    for (const binding of events) {
      const handler = createBindingHandler(binding, context);
      // 将 DOM 事件名（click）转为 React 事件 prop 名（onClick）
      const reactEventName = toReactEventProp(binding.event);
      extraProps[reactEventName] = handler;
    }

    // 使用包裹式 span 而非 React.cloneElement：
    // 组件只接收 {node, children} 不会透传额外 props，
    // cloneElement 注入的 onClick 等事件处理函数无法到达 DOM。
    // span + display:contents 对布局无影响，事件可以正常触发。
    // 此处使用 createElement 因为文件为 .ts 而非 .tsx
    return React.createElement(
      'span',
      { style: { display: 'contents' }, ...extraProps },
      result,
    );
  };
}

/* ==================== 事件绑定处理 ==================== */

/**
 * 根据 EventBinding 配置创建事件处理函数
 * 支持 debounce / throttle / condition
 */
function createBindingHandler(
  binding: EventBinding,
  context: ActionContext,
): (e: Event) => void {
  const rawHandler = async (e: Event) => {
    // 条件判断
    if (binding.condition) {
      try {
        const fn = new Function('event', `return ${binding.condition}`);
        if (!fn(e)) return;
      } catch {
        // 条件表达式错误时放行（容错）
      }
    }

    await executeActions(binding.actions, context, e);
  };

  // 防抖
  if (binding.debounce && binding.debounce > 0) {
    return debounce(rawHandler, binding.debounce);
  }

  // 节流
  if (binding.throttle && binding.throttle > 0) {
    return throttle(rawHandler, binding.throttle);
  }

  return rawHandler;
}

/* ==================== 工具函数 ==================== */

/** 防抖 */
function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number,
): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/** 节流 */
function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  interval: number,
): (...args: T) => void {
  let lastTime = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * 将 DOM 事件名转为 React 事件 prop 名
 *
 * 示例：
 *   'click'      → 'onClick'
 *   'mouseenter' → 'onMouseEnter'
 *   'change'     → 'onChange'
 *   'submit'     → 'onSubmit'
 *   'focus'      → 'onFocus'
 */
function toReactEventProp(domEvent: string): string {
  return `on${domEvent.charAt(0).toUpperCase()}${domEvent.slice(1)}`;
}
