/**
 * VariableParser 中间件
 *
 * 功能：
 * - 读取 node.props 中所有字符串值，查找 `{{variableName}}` 模板语法
 * - 从外部传入的 variables 对象中查找并替换
 * - 未找到的变量保留原样（不报错）
 *
 * 用法（Schema 中设置 node.props）：
 * ```json
 * {
 *   "content": "欢迎，{{username}}！",
 *   "href": "/user/{{userId}}"
 * }
 * ```
 *
 * 集成（Web 端）：
 * ```tsx
 * const variableParser = createVariableParserMiddleware({
 *   username: "张三",
 *   userId: "12345",
 *   siteName: "Abner's Blog"
 * });
 *
 * <RendererProvider
 *   extraMiddlewares={[styleInjector, variableParser]}
 * >
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 *
 * v1 实现：字符串 props 的模板变量替换
 * 预留扩展：深层嵌套变量、数组变量遍历、异步变量解析
 */

import type { SchemaNode, Middleware } from '../types';

/* ==================== 常量 ==================== */

/** 变量模板正则：匹配 {{variableName}} */
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/* ==================== 变量解析核心 ==================== */

/**
 * 解析字符串中的模板变量
 *
 * @param template - 包含 {{key}} 模板的字符串
 * @param variables - 变量字典
 * @returns 替换后的字符串
 */
function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(VARIABLE_REGEX, (_, varName: string) => {
    const trimmed = varName.trim();
    if (trimmed in variables) {
      const value = variables[trimmed];
      // 如果变量值为空字符串或 undefined，返回空字符串
      if (value === undefined || value === null || value === '') {
        return '';
      }
      return String(value);
    }
    // 变量不存在时返回空字符串，而不是模板字符串
    return '';
  });
}

/**
 * 解析节点 props 中的所有模板变量
 *
 * @param props - 原始 props
 * @param variables - 变量字典
 * @returns 解析后的 props（如有替换）或 null（无替换）
 */
function resolveProps(
  props: Record<string, unknown>,
  variables: Record<string, unknown>,
): Record<string, unknown> | null {
  const resolvedProps: Record<string, unknown> = {};
  let hasReplacement = false;

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && value.includes('{{')) {
      const resolved = resolveTemplate(value, variables);
      if (resolved !== value) {
        resolvedProps[key] = resolved;
        hasReplacement = true;
      }
    }
  }

  return hasReplacement ? resolvedProps : null;
}

/* ==================== 中间件工厂 ==================== */

/**
 * 创建变量解析中间件（静态变量）
 *
 * 适用于变量不会变化的场景，传入固定的 variables 对象。
 *
 * @param variables - 变量字典，key 为变量名，value 为变量值
 * @returns Middleware
 */
export function createVariableParserMiddleware(
  variables: Record<string, unknown>,
): Middleware {
  if (!variables || Object.keys(variables).length === 0) {
    return (node: SchemaNode, next) => next(node);
  }

  return (node: SchemaNode, next) => {
    const resolved = resolveProps(node.props, variables);
    if (!resolved) return next(node);

    return next({
      ...node,
      props: { ...node.props, ...resolved },
    });
  };
}

/**
 * 创建动态变量解析中间件
 *
 * 适用于需要与 ActionContext.variables 实时联动的场景。
 * 通过 getter 函数在每次渲染时动态获取变量值，
 * 确保 set-variable 动作修改变量后，模板变量能读取到最新值。
 *
 * 用法：
 * ```tsx
 * // 共享变量存储
 * const pageVars: Record<string, unknown> = {};
 *
 * // 动态中间件：每次渲染时从 pageVars 读取最新值
 * const variableParser = createDynamicVariableParserMiddleware(() => pageVars);
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
 *   extraMiddlewares={[styleInjector, variableParser]}
 *   actionContextFactory={actionContextFactory}
 * >
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 *
 * @param getVariables - 返回当前变量字典的函数，每次渲染时调用
 * @returns Middleware
 */
export function createDynamicVariableParserMiddleware(
  getVariables: () => Record<string, unknown>,
): Middleware {
  return (node: SchemaNode, next) => {
    const variables = getVariables() || {};

    // 检查是否有模板变量需要解析
    const hasTemplateVars = Object.values(node.props).some(
      (v) => typeof v === 'string' && v.includes('{{'),
    );

    // 如果没有模板变量，直接返回
    if (!hasTemplateVars) return next(node);

    // 解析模板变量（即使变量为空也要解析，将 {{xxx}} 替换为空字符串）
    const resolved = resolveProps(node.props, variables);
    if (!resolved) return next(node);

    return next({
      ...node,
      props: { ...node.props, ...resolved },
    });
  };
}
