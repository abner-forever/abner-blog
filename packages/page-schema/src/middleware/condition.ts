/**
 * ConditionEvaluator 中间件
 *
 * 功能：
 * - 读取 node.props.condition → 按条件判断是否渲染组件
 * - 读取 node.props.show → 布尔值直接控制显隐
 * - 条件不满足时返回 null（跳过渲染）
 * - 条件满足时正常透传
 *
 * 用法（Schema 中设置 node.props）：
 * ```json
 * {
 *   "show": true,
 *   "condition": {
 *     "field": "userRole",
 *     "operator": "eq",
 *     "value": "admin"
 *   }
 * }
 * ```
 *
 * 支持的运算符：
 * - eq: 相等
 * - neq: 不相等
 * - gt: 大于（数字）
 * - lt: 小于（数字）
 * - gte: 大于等于（数字）
 * - lte: 小于等于（数字）
 * - contains: 包含（字符串）
 * - notContains: 不包含（字符串）
 * - in: 在数组中
 * - notIn: 不在数组中
 *
 * 集成（Web 端）：
 * ```tsx
 * const conditionEval = createConditionMiddleware({
 *   userRole: "admin",
 *   isLoggedIn: true,
 *   articleCount: 42
 * });
 *
 * <RendererProvider
 *   extraMiddlewares={[styleInjector, conditionEval]}
 * >
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 *
 * v1 实现：简单的条件判断 + show 布尔值
 * 预留扩展：复合条件（AND/OR/NOT）、异步条件、A/B 测试分组
 */

import type { SchemaNode, Middleware } from '../types';

/* ==================== 类型定义 ==================== */

/** 条件运算符 */
export type ConditionOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'contains'
  | 'notContains'
  | 'in'
  | 'notIn';

/** 条件配置 */
export interface ConditionConfig {
  /** 上下文中的字段名 */
  field: string;
  /** 比较运算符 */
  operator: ConditionOperator;
  /** 比较值 */
  value: unknown;
}

/* ==================== 条件求值 ==================== */

/**
 * 求值单个条件
 *
 * @param condition - 条件配置
 * @param context - 求值上下文（包含所有可用变量）
 * @returns 条件是否满足
 */
function evaluateCondition(
  condition: ConditionConfig,
  context: Record<string, unknown>,
): boolean {
  const actualValue = context[condition.field];
  const { value } = condition;

  switch (condition.operator) {
    case 'eq':
      // 严格相等，或类型不同时尝试字符串比较（处理输入框值为字符串的情况）
      return actualValue === value || String(actualValue) === String(value);
    case 'neq':
      return actualValue !== value && String(actualValue) !== String(value);
    case 'gt':
      return (
        typeof actualValue === 'number' &&
        typeof value === 'number' &&
        actualValue > value
      );
    case 'lt':
      return (
        typeof actualValue === 'number' &&
        typeof value === 'number' &&
        actualValue < value
      );
    case 'gte':
      return (
        typeof actualValue === 'number' &&
        typeof value === 'number' &&
        actualValue >= value
      );
    case 'lte':
      return (
        typeof actualValue === 'number' &&
        typeof value === 'number' &&
        actualValue <= value
      );
    case 'contains':
      return String(actualValue).includes(String(value));
    case 'notContains':
      return !String(actualValue).includes(String(value));
    case 'in':
      return Array.isArray(value) && value.includes(actualValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(actualValue);
    default:
      return true;
  }
}

/* ==================== 中间件工厂 ==================== */

/**
 * 创建条件渲染中间件（静态上下文）
 *
 * 适用于变量不会变化的场景，传入固定的 context 对象。
 *
 * 优先级规则：
 * - 如果存在 condition 配置，由 condition 控制显隐（忽略 show 属性）
 * - 如果只有 show 属性（无 condition），由 show 控制显隐
 *
 * @param context - 求值上下文，包含所有可用的状态变量
 * @returns Middleware
 */
export function createConditionMiddleware(
  context: Record<string, unknown>,
): Middleware {
  return (node: SchemaNode, next) => {
    // 读取 condition 配置
    const condition = node.props.condition as ConditionConfig | undefined;

    // 如果存在 condition，由 condition 控制显隐（忽略 show 属性）
    if (condition && condition.field) {
      const met = evaluateCondition(condition, context);
      if (!met) return null;
      return next(node);
    }

    // 如果没有 condition，检查 show 属性（向后兼容）
    const show = node.props.show as boolean | undefined;
    if (show === false) return null;

    // 条件满足，正常渲染
    return next(node);
  };
}

/**
 * 创建动态条件渲染中间件
 *
 * 适用于需要与 ActionContext.variables 实时联动的场景。
 * 通过 getter 函数在每次渲染时动态获取变量值，
 * 确保 set-variable 动作修改变量后，condition 中间件能读取到最新值。
 *
 * 优先级规则：
 * - 如果存在 condition 配置，由 condition 控制显隐（忽略 show 属性）
 * - 如果只有 show 属性（无 condition），由 show 控制显隐
 *
 * 用法：
 * ```tsx
 * // 共享变量存储
 * const pageVars: Record<string, unknown> = {};
 *
 * // 动态中间件：每次渲染时从 pageVars 读取最新值
 * const conditionMiddleware = createDynamicConditionMiddleware(() => pageVars);
 *
 * // actionContext 也使用同一个 pageVars
 * const actionContextFactory = (rootNode) => ({
 *   variables: {
 *     get: (key) => pageVars[key],
 *     set: (key, value) => { pageVars[key] = value; },
 *     ...
 *   },
 *   ...
 * });
 *
 * <RendererProvider
 *   extraMiddlewares={[styleInjector, conditionMiddleware]}
 *   actionContextFactory={actionContextFactory}
 * >
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 *
 * @param getContext - 返回当前变量上下文的函数，每次渲染时调用
 * @returns Middleware
 */
export function createDynamicConditionMiddleware(
  getContext: () => Record<string, unknown>,
): Middleware {
  return (node: SchemaNode, next) => {
    // 读取 condition 配置
    const condition = node.props.condition as ConditionConfig | undefined;

    // 如果存在 condition，由 condition 控制显隐（忽略 show 属性）
    if (condition && condition.field) {
      const context = getContext();
      const met = evaluateCondition(condition, context);
      if (!met) return null;
      return next(node);
    }

    // 如果没有 condition，检查 show 属性（向后兼容）
    const show = node.props.show as boolean | undefined;
    if (show === false) return null;

    // 条件满足，正常渲染
    return next(node);
  };
}
