/**
 * ActionContext - 动作执行上下文
 *
 * 动作执行时需要的全部外部能力。
 * 通过 IoC 模式注入，而非硬编码依赖，使得引擎与宿主环境解耦。
 *
 * 宿主应用（apps/web、apps/admin）在初始化 RendererProvider 时
 * 传入 actionContext 工厂函数，将具体实现注入到事件执行流程中。
 */

import type { SchemaNode } from '../types';

/**
 * Toast 消息能力
 */
export interface ToastCapability {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

/**
 * 弹窗管理能力
 */
export interface ModalCapability {
  open: (modalId: string, data?: Record<string, unknown>) => void;
  close: (modalId: string) => void;
}

/**
 * 页面级变量存储能力
 */
export interface VariableCapability {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
  clear: () => void;
}

/**
 * 自定义事件总线能力
 */
export interface EventBusCapability {
  emit: (name: string, detail?: unknown) => void;
  on: (name: string, handler: (detail?: unknown) => void) => () => void;
}

/**
 * 动作执行上下文
 *
 * 每个事件触发时创建，注入到动作执行链中。
 */
export interface ActionContext {
  /** 触发事件的 SchemaNode */
  sourceNode: SchemaNode;

  /** Toast 消息提示 */
  toast: ToastCapability;

  /** 弹窗管理 */
  modals: ModalCapability;

  /** 页面跳转 */
  navigate: (url: string, target?: '_self' | '_blank') => void;

  /** 页面级变量存储 */
  variables: VariableCapability;

  /** 自定义事件总线 */
  eventBus: EventBusCapability;

  /** 获取页面根节点（用于 find 等操作） */
  getRootNode: () => SchemaNode;
}
