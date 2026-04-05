import { STORAGE_KEY } from './constants.js';
import { parseStoredMeta } from './parse-meta.js';
import type { EnvMeta, EnvToolStorage, EnvToolStorageBackend } from './types.js';

async function toResult<T>(v: T | Promise<T>): Promise<T> {
  return await v;
}

export function createSessionStorageBackend(): EnvToolStorageBackend {
  return {
    getItem(key: string) {
      return sessionStorage.getItem(key);
    },
    setItem(key: string, value: string) {
      sessionStorage.setItem(key, value);
    },
    removeItem(key: string) {
      sessionStorage.removeItem(key);
    },
  };
}

export function mergeStorage(
  user?: Partial<EnvToolStorage> & Partial<EnvToolStorageBackend>,
): EnvToolStorage {
  const base = createSessionStorageBackend();
  const b: EnvToolStorageBackend = {
    getItem: (k) => toResult(user?.getItem?.(k) ?? base.getItem(k)),
    setItem: (k, v) => toResult(user?.setItem?.(k, v) ?? base.setItem(k, v)),
    removeItem: (k) =>
      toResult(user?.removeItem?.(k) ?? base.removeItem(k)),
  };

  const parseEnv =
    user?.parseEnv ??
    ((raw: string | null): EnvMeta => parseStoredMeta(raw));

  return {
    ...b,
    parseEnv,
    async getEnv(): Promise<EnvMeta> {
      const raw = await b.getItem(STORAGE_KEY);
      return parseEnv(typeof raw === 'string' ? raw : null);
    },
    async setEnv(value: string): Promise<void> {
      await b.setItem(STORAGE_KEY, value);
    },
    async clearEnv(): Promise<void> {
      await b.removeItem(STORAGE_KEY);
    },
  };
}
