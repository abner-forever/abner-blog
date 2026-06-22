/**
 * 设置变量动作
 *
 * 在指定作用域设置变量值。
 * scope 支持 three 层级：
 * - local：当前动作链内（暂不支持）
 * - page：页面级变量，通过 context.variables
 * - global：全局变量，通过 window.__pageSchemaVars
 */

import type { ActionHandler } from '../executor';
import type { SetVariableActionConfig } from '../../types';

export const setVariableAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as SetVariableActionConfig;

  switch (config.scope ?? 'page') {
    case 'local':
      // 暂不支持 local 作用域（需要执行引擎维护局部变量栈）
      break;
    case 'page':
      context.variables.set(config.key, config.value);
      break;
    case 'global':
      // 全局变量：挂载到 window 上，跨页面共享
      if (typeof window !== 'undefined') {
        const globalStore = (window as unknown as Record<string, unknown>)
          .__pageSchemaVars as Record<string, unknown> | undefined;
        if (globalStore) {
          globalStore[config.key] = config.value;
        } else {
          (window as unknown as Record<string, unknown>).__pageSchemaVars = {
            [config.key]: config.value,
          };
        }
      }
      break;
  }
};
