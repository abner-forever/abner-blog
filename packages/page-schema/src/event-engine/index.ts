/**
 * 事件引擎
 *
 * 页面 Schema 事件系统的运行时执行层。
 * 负责将 Schema 中定义的 EventBinding[] 转换为真实的事件监听和动作执行。
 *
 * 使用流程：
 * 1. 应用初始化时调用 registerBuiltInActions()
 * 2. 创建 ActionContext 实例（宿主提供具体能力）
 * 3. 事件触发时调用 executeActions(actions, context, event)
 *
 * 扩展方式：
 * - 自定义动作类型：actionRegistry.register('my-action', handler)
 * - 扩展动作上下文：扩展 ActionContext 接口，在工厂函数中提供实现
 */

export { ActionRegistry, actionRegistry, executeActions } from './executor';
export type { ActionHandler } from './executor';

export type {
  ActionContext,
  ToastCapability,
  ModalCapability,
  VariableCapability,
  EventBusCapability,
} from './action-context';

export { registerBuiltInActions } from './built-in-actions';

// 内置动作处理器（可单独导入使用）
export { toastAction } from './built-in-actions/toast';
export { navigateAction } from './built-in-actions/navigate';
export { openModalAction, closeModalAction } from './built-in-actions/modal';
export { confirmAction } from './built-in-actions/confirm';
export { setVariableAction } from './built-in-actions/set-variable';
export { callApiAction } from './built-in-actions/call-api';
export { dispatchEventAction } from './built-in-actions/dispatch-event';
export { reloadAction } from './built-in-actions/reload';
export { backAction } from './built-in-actions/back';
export { scrollToAction } from './built-in-actions/scroll-to';
export { customCodeAction } from './built-in-actions/custom-code';
