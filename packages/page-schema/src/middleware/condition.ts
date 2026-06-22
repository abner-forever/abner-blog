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
      return actualValue === value;
    case 'neq':
      return actualValue !== value;
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
 * 创建条件渲染中间件
 *
 * @param context - 求值上下文，包含所有可用的状态变量
 * @returns Middleware
 */
export function createConditionMiddleware(
  context: Record<string, unknown>,
): Middleware {
  return (node: SchemaNode, next) => {
    // 1. show 布尔值
    const show = node.props.show as boolean | undefined;
    if (show === false) return null;

    // 2. condition 条件判断
    const condition = node.props.condition as ConditionConfig | undefined;
    if (condition) {
      const met = evaluateCondition(condition, context);
      if (!met) return null;
    }

    // 条件满足，正常渲染
    return next(node);
  };
}
