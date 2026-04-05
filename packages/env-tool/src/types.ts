/** sessionStorage 中保存的结构（兼容历史仅存 JSON 字符串的环境名） */
export type EnvMeta = {
  env: string;
  key: string | null;
};

export type EnvOption = {
  key: string;
  needKey: boolean;
};

export type EntryBtnPosition = Record<string, string | number>;

export type EnvToolInitOptions = {
  debug?: boolean;
  storage?: Partial<EnvToolStorage> & EnvToolStorageBackend;
  entryBtnStyle?: {
    zIndex?: number;
    position?: EntryBtnPosition;
  };
};

/** 与 sessionStorage 一致的底层读写 */
export type EnvToolStorageBackend = {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
};

/** init 时合并后的 storage（含 getEnv/setEnv/clearEnv） */
export type EnvToolStorage = EnvToolStorageBackend & {
  parseEnv(raw: string | null): EnvMeta;
  getEnv(): Promise<EnvMeta>;
  setEnv(value: string): Promise<void>;
  clearEnv(): Promise<void>;
};
