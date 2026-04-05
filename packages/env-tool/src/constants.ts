import type { EnvMeta, EnvOption } from './types.js';

export const STORAGE_KEY = 'ABNER_ENV_META';

export const DEFAULT_META: EnvMeta = {
  env: 'CUSTOM',
  key: null,
};

export const ENV_OPTIONS: EnvOption[] = [
  { key: 'CUSTOM', needKey: true },
  { key: 'ABNER', needKey: true },
  { key: 'TEST', needKey: true },
];

/** 选择这些环境时不展示「独立环境代号」输入框 */
export const ENV_WITHOUT_BRANCH_KEY = new Set<string>(['QA']);
