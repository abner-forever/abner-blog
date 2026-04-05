import { DEFAULT_META } from './constants.js';
import type { EnvMeta } from './types.js';

/**
 * 解析 sessionStorage 中的 JSON。
 * 兼容历史：仅写入 JSON.stringify("QA") 时解析为 { env: "QA", key: null }。
 */
export function parseStoredMeta(raw: string | null): EnvMeta {
  if (raw == null || raw === '') {
    return { ...DEFAULT_META };
  }
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v === 'string') {
      return { env: v, key: null };
    }
    if (v && typeof v === 'object' && 'env' in v) {
      const o = v as { env?: unknown; key?: unknown };
      return {
        env: String(o.env ?? DEFAULT_META.env),
        key: o.key != null && o.key !== '' ? String(o.key) : null,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_META };
}
