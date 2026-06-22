/**
 * AnimationInjector 中间件
 *
 * 功能：
 * - 读取 node.props.animation → 注入 CSS 入场动画
 * - 支持的动画类型：fadeIn, slideInLeft/Right/Up/Down, zoomIn, bounceIn
 * - 通过 animation.duration / animation.delay / animation.timingFunction 自定义
 *
 * 用法（Schema 中设置 node.props）：
 * ```json
 * {
 *   "animation": {
 *     "type": "fadeIn",
 *     "duration": 500,
 *     "delay": 200,
 *     "timingFunction": "ease-out"
 *   }
 * }
 * ```
 *
 * v1 实现：一次性注入所有 keyframes 到 document.head
 * 预留扩展：滚动触发动画（IntersectionObserver）、关键帧可配置
 */

import React from 'react';
import type { SchemaNode, Middleware } from '../types';

/* ==================== 类型定义 ==================== */

export interface AnimationConfig {
  /** 动画类型 */
  type: 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInUp' | 'slideInDown' | 'zoomIn' | 'bounceIn';
  /** 动画持续时间（ms，默认 300） */
  duration?: number;
  /** 动画延迟（ms，默认 0） */
  delay?: number;
  /** 缓动函数（默认 ease-out） */
  timingFunction?: string;
}

/* ==================== Keyframes 定义 ==================== */

const KEYFRAMES: Record<string, string> = {
  fadeIn: `@keyframes mw-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
  slideInLeft: `@keyframes mw-slideInLeft {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`,
  slideInRight: `@keyframes mw-slideInRight {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}`,
  slideInUp: `@keyframes mw-slideInUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`,
  slideInDown: `@keyframes mw-slideInDown {
  from { transform: translateY(-30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}`,
  zoomIn: `@keyframes mw-zoomIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}`,
  bounceIn: `@keyframes mw-bounceIn {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}`,
};

/* ==================== Keyframes 注入 ==================== */

let keyframesInjected = false;

/** 将动画 keyframes 注入到 document.head（全局只需一次） */
function ensureKeyframes(): void {
  if (keyframesInjected) return;
  keyframesInjected = true;

  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-mw-keyframes', '');
  style.textContent = Object.values(KEYFRAMES).join('\n');
  document.head.appendChild(style);
}

/* ==================== 中间件 ==================== */

/**
 * AnimationInjector 中间件
 *
 * 将 node.props.animation 配置的动画注入到组件的渲染结果中。
 * 通过 cloneElement 添加 animation CSS 属性。
 */
export const animationInjector: Middleware = (node: SchemaNode, next) => {
  const animation = node.props.animation as AnimationConfig | undefined;

  // 无动画配置，透传
  if (!animation) return next(node);

  const result = next(node);

  // null 表示跳过渲染
  if (result === null) return null;

  // 透传标记：还没到组件渲染阶段
  if (!React.isValidElement(result)) return result;

  // 确保 keyframes 在 document 中
  if (typeof document !== 'undefined') {
    ensureKeyframes();
  }

  const duration = animation.duration ?? 300;
  const delay = animation.delay ?? 0;
  const timing = animation.timingFunction ?? 'ease-out';

  const animationStyle: React.CSSProperties = {
    animation: `mw-${animation.type} ${duration}ms ${timing} ${delay}ms both`,
  };

  const existingStyle = (result.props as Record<string, unknown>).style as
    | React.CSSProperties
    | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.cloneElement(result as React.ReactElement<any>, {
    style: { ...animationStyle, ...existingStyle },
  });
};
