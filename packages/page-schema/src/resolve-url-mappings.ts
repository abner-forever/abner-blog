/**
 * resolve-url-mappings — URL 参数→变量映射解析器
 *
 * 将 URL search params 中的值按配置映射到 VariableStore。
 * 支持类型转换（string/number/boolean/array）和兜底默认值。
 * 支持 captureAll 模式：一键抓取全部参数存为对象。
 *
 * 在 RendererProvider 初始化阶段（Phase 2）被调用。
 */

import type { UrlMappingItem } from './types';
import type { VariableStore } from './variable-store';

/* ==================== 类型转换 ==================== */

/**
 * 按指定类型解析 URL 参数字符串
 */
function parseParamValue(
  raw: string,
  type: UrlMappingItem['type'],
  separator?: string,
): unknown {
  switch (type) {
    case 'number': {
      const n = Number(raw);
      return Number.isNaN(n) ? raw : n;
    }
    case 'boolean':
      return raw === 'true' || raw === '1';
    case 'array':
      return raw.split(separator || ',').map((s) => s.trim()).filter(Boolean);
    case 'string':
    default:
      return raw;
  }
}

/**
 * 将全部 URL 参数转换为键值对象
 */
function captureAllParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

/* ==================== 主函数 ==================== */

/**
 * 解析 URL 参数并写入 VariableStore
 *
 * 处理逻辑：
 * 1. 先处理 captureAll 项（全量捕获）
 * 2. 再处理单项映射
 *    a. URL 中有该参数 → 解析类型后写入
 *    b. URL 中无参数且 initial 也未设置且 default 存在 → 写入 default
 *    c. URL 中无参数且变量已存在 → 保留不动
 *
 * @param mappings - URL 参数映射配置数组
 * @param store - VariableStore 实例
 * @param searchString - query string，默认从 window.location.search 读取
 */
export function resolveUrlMappings(
  mappings: UrlMappingItem[],
  store: VariableStore,
  searchString?: string,
): void {
  if (!mappings.length) return;

  const searchParams = new URLSearchParams(
    searchString ?? (typeof window !== 'undefined' ? window.location.search : ''),
  );

  for (const mapping of mappings) {
    if (mapping.captureAll) {
      // 全量捕获：将全部 URL 参数存为一个对象
      const allParams = captureAllParams(searchParams);
      store.set(mapping.as, allParams);
      continue;
    }

    // 单项映射
    if (!mapping.param) continue;

    const raw = searchParams.get(mapping.param);

    if (raw !== null) {
      // URL 中有该参数 → 解析并写入
      const value = parseParamValue(raw, mapping.type ?? 'string', mapping.separator);
      store.set(mapping.as, value);
    } else if (mapping.default !== undefined && store.get(mapping.as) === undefined) {
      // URL 中无参数，变量不存在，且配置了 default → 写入 default
      store.set(mapping.as, mapping.default);
    }
    // else: URL 中无参数但变量已存在（来自 initial）→ 保留
  }
}
