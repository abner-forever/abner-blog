/**
 * ActionExecutor - 事件动作执行器
 *
 * 核心职责：
 * 1. ActionRegistry：管理动作类型 → 执行函数的映射
 * 2. executeActions：串行执行一个动作链，支持嵌套子动作
 *
 * 设计原则：
 * - 动作处理器是纯函数，不持有状态
 * - 通过 ActionContext 注入所有外部能力
 * - 嵌套子动作（confirm.onConfirm、call-api.onSuccess）递归调用 executeActions
 */

import type { EventAction, EventActionType } from '../types';
import type { ActionContext } from './action-context';
import { resolveObjectTemplates } from '../resolve-template';

/* ==================== 动作处理器类型 ==================== */

/**
 * 单个动作处理函数
 * 每个动作类型注册一个此签名的处理函数
 */
export type ActionHandler = (
  action: EventAction,
  context: ActionContext,
  event: Event,
) => void | Promise<void>;

/* ==================== 动作注册表 ==================== */

/**
 * 动作注册表
 * 管理动作类型到处理函数的映射，支持运行时扩展
 */
export class ActionRegistry {
  private handlers = new Map<EventActionType, ActionHandler>();

  /**
   * 注册动作处理器
   * 如果已存在同类型处理器，会被覆盖
   */
  register(type: EventActionType, handler: ActionHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * 批量注册动作处理器
   */
  registerAll(actions: Record<string, ActionHandler>): void {
    Object.entries(actions).forEach(([type, handler]) => {
      this.handlers.set(type as EventActionType, handler);
    });
  }

  /**
   * 获取动作处理器
   */
  get(type: EventActionType): ActionHandler | undefined {
    return this.handlers.get(type);
  }

  /**
   * 检查某个动作类型是否已注册
   */
  has(type: EventActionType): boolean {
    return this.handlers.has(type);
  }
}

/* ==================== 全局注册表实例 ==================== */

/**
 * 全局默认动作注册表
 * 内置动作在 built-in-actions 中注册到此实例
 * 宿主应用可通过 register/registerAll 扩展自定义动作
 */
export const actionRegistry = new ActionRegistry();

/* ==================== 核心执行函数 ==================== */

/**
 * 串行执行动作链
 *
 * 按顺序执行 actions 列表中的每个动作。
 * 对异步动作（如 call-api）会 await 等待完成。
 * 某个动作抛出异常不会中断后续动作（但会静默捕获）。
 *
 * @param actions - 要执行的动作列表
 * @param context - 动作执行上下文
 * @param event - 原始 DOM 事件
 */
export async function executeActions(
  actions: EventAction[],
  context: ActionContext,
  event: Event,
): Promise<void> {
  for (const action of actions) {
    const handler = actionRegistry.get(action.type);
    if (!handler) {
      // 未注册的动作类型，跳过（不抛异常，保证容错）
      continue;
    }

    try {
      // 自动解析 action.config 中的 {{varName}} 模板变量
      // 支持 {{urlParams.id}} 等点号路径，从 current VariableStore 取值
      const resolvedConfig = resolveObjectTemplates(
        action.config,
        (key) => context.variables.get(key),
      );
      const resolvedAction = resolvedConfig !== action.config
        ? { ...action, config: resolvedConfig }
        : action;

      await handler(resolvedAction, context, event);
    } catch (err) {
      // 单个动作执行失败不影响后续动作
      console.error(
        `[PageSchema] 动作执行失败: ${action.type}(${action.id})`,
        err,
      );
    }
  }
}
