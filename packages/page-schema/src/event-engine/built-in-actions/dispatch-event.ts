/**
 * 自定义事件派发动作
 *
 * 通过 window CustomEvent 或 context eventBus 派发自定义事件。
 * 用于组件间通信、触发宿主自定义逻辑等场景。
 */

import type { ActionHandler } from '../executor';
import type { DispatchEventActionConfig } from '../../types';

export const dispatchEventAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as DispatchEventActionConfig;

  // 1. 通过 context eventBus 派发（内部通信）
  context.eventBus.emit(config.eventName, config.detail);

  // 2. 通过 window CustomEvent 派发（外部可监听）
  if (typeof window !== 'undefined') {
    const customEvent = new CustomEvent(config.eventName, {
      detail: config.detail,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(customEvent);
  }
};
