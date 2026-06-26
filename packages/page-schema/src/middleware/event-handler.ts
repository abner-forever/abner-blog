/**
 * EventHandler 中间件 v3
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
 * - 对于 change 事件，使用原生 DOM 事件监听器确保冒泡正常工作
 *
 * 使用方式（由 RendererProvider 自动注入，宿主无需手动添加）：
 * ```tsx
 * <RendererProvider schema={schema} actionContextFactory={factory}>
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 */

import React, { useEffect, useRef } from 'react';
import type { SchemaNode, Middleware, EventBinding } from '../types';
import type { ActionContext } from '../event-engine/action-context';
import { executeActions } from '../event-engine/executor';

/* ==================== 工厂函数 ==================== */

/**
 * 事件处理器包装组件
 * 使用原生 DOM 事件监听器确保 change 事件正常工作
 */
interface EventHandlerWrapperProps {
  events: EventBinding[];
  context: ActionContext;
  children?: React.ReactNode;
}

const EventHandlerWrapper: React.FC<EventHandlerWrapperProps> = ({
  events,
  context,
  children,
}) => {
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const cleanupFns: Array<() => void> = [];

    // 直接找到内部的表单元素（input/select/textarea），在元素上监听
    const findFormElement = (): HTMLElement | null => {
      return wrapper.querySelector('input, select, textarea');
    };

    for (const binding of events) {
      const handler = createBindingHandler(binding, context);

      // 在包裹 span 上使用 capture 阶段捕获，确保不被 React 拦截
      wrapper.addEventListener(binding.event, handler, true);

      // 对于 change 事件，额外监听 input 事件实现实时更新
      // （select 不支持 input 事件，但 change 已经能捕获）
      if (binding.event === 'change') {
        wrapper.addEventListener('input', handler, true);
        cleanupFns.push(() => {
          wrapper.removeEventListener('input', handler, true);
        });

        // 直接在表单元素上也监听 change，防止冒泡丢失
        const formEl = findFormElement();
        if (formEl) {
          formEl.addEventListener('change', handler);
          cleanupFns.push(() => {
            formEl.removeEventListener('change', handler);
          });
        }
      }

      cleanupFns.push(() => {
        wrapper.removeEventListener(binding.event, handler, true);
      });
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [events, context]);

  return React.createElement(
    'span',
    { ref: wrapperRef, style: { display: 'contents' } },
    children,
  );
};

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

    // 使用 EventHandlerWrapper 组件来处理事件绑定
    return React.createElement(
      EventHandlerWrapper,
      { events, context },
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
