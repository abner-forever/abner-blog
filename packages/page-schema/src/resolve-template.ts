/**
 * resolve-template — 模板变量解析工具
 *
 * 提供 {{varName}} 和 {{varName.path}} 模板变量的解析能力。
 * 支持点号路径，如 {{urlParams.id}}、{{articleDetail.author.name}}。
 *
 * 被以下模块共用：
 * - variable-parser 中间件（渲染时解析 node.props）
 * - executor（事件动作执行时解析 action.config）
 * - execute-data-sources（解析 dataSource.url）
 */

/** 变量模板正则：匹配 {{variableName}} 或 {{variable.nested.path}} */
export const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * 通过点号路径从对象中取值
 *
 * @param obj - 根对象
 * @param path - 点号路径，如 "author.name"
 * @returns 路径指向的值，或 undefined
 *
 * @example
 * ```ts
 * getByPath({ author: { name: "张三" } }, "author.name") // => "张三"
 * getByPath({ a: [{ b: 1 }] }, "a.0.b")                 // => 1
 * ```
 */
function getByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce<unknown>((current, key) => {
    if (current == null || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}

/**
 * 解析模板字符串中的变量引用
 *
 * @param template - 包含 {{key}} 或 {{key.nested}} 的字符串
 * @param getValue - 根据根变量名获取值的函数（如 store.get）
 * @returns 所有变量替换后的字符串
 *
 * @example
 * ```ts
 * resolveTemplateVars("你好，{{urlParams.name}}", (key) => {
 *   if (key === "urlParams") return { name: "张三", id: "123" };
 *   return undefined;
 * })
 * // => "你好，张三"
 * ```
 */
export function resolveTemplateVars(
  template: string,
  getValue: (key: string) => unknown,
): string {
  return template.replace(VARIABLE_REGEX, (_, varName: string) => {
    const trimmed = varName.trim();
    if (!trimmed) return '';

    const parts = trimmed.split('.');
    const rootKey = parts[0];
    const rootValue = getValue(rootKey);

    if (rootValue == null) return '';

    if (parts.length === 1) {
      return String(rootValue);
    }

    // 多段路径：取 rootValue 后继续遍历
    const nestedPath = parts.slice(1).join('.');
    const value = getByPath(rootValue, nestedPath);
    return value != null ? String(value) : '';
  });
}

/**
 * 递归遍历对象，解析所有字符串值中的模板变量
 *
 * @param obj - 可能含模板变量的对象（如 action.config）
 * @param getValue - 变量值获取函数
 * @returns 解析后的新对象（不变更原对象）
 */
export function resolveObjectTemplates(
  obj: Record<string, unknown>,
  getValue: (key: string) => unknown,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let changed = false;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.includes('{{')) {
      const resolved = resolveTemplateVars(value, getValue);
      result[key] = resolved;
      if (resolved !== value) changed = true;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nested = resolveObjectTemplates(
        value as Record<string, unknown>,
        getValue,
      );
      result[key] = nested;
      changed = true;
    } else {
      result[key] = value;
    }
  }

  return changed ? result : obj;
}
