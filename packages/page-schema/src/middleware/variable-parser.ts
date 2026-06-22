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

/* ==================== 中间件工厂 ==================== */

/**
 * 创建变量解析中间件
 *
 * @param variables - 变量字典，key 为变量名，value 为变量值
 * @returns Middleware
 */
export function createVariableParserMiddleware(
  variables: Record<string, unknown>,
): Middleware {
  // 无变量时返回透传中间件
  if (!variables || Object.keys(variables).length === 0) {
    return (node: SchemaNode, next) => next(node);
  }

  return (node: SchemaNode, next) => {
    // 扫描所有字符串 props，收集需要替换的
    const resolvedProps: Record<string, unknown> = {};
    let hasReplacement = false;

    for (const [key, value] of Object.entries(node.props)) {
      if (typeof value === 'string' && value.includes('{{')) {
        const resolved = value.replace(VARIABLE_REGEX, (_, varName: string) => {
          const trimmed = varName.trim();
          if (trimmed in variables) {
            return String(variables[trimmed]);
          }
          // 变量未找到，保留原样
          return `{{${trimmed}}}`;
        });
        if (resolved !== value) {
          resolvedProps[key] = resolved;
          hasReplacement = true;
        }
      }
    }

    // 没有需要替换的变量，直接透传
    if (!hasReplacement) return next(node);

    // 创建替换后的新节点
    const resolvedNode: SchemaNode = {
      ...node,
      props: { ...node.props, ...resolvedProps },
    };

    return next(resolvedNode);
  };
}
