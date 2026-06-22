/**
 * 自定义代码动作
 *
 * 执行用户编写的 JavaScript 代码字符串。
 * 使用 new Function() 创建独立作用域，避免 eval 的全局污染问题。
 * 注入上下文变量，让用户可以调用引擎提供的能力。
 *
 * 可用的注入变量：
 * - context  - ActionContext 全部能力
 * - event    - 原始 DOM 事件对象
 * - variables - 页面变量的键值对快照
 * - $toast   - Toast 便捷访问
 * - $navigate - 导航快捷函数
 * - $modals  - 弹窗管理
 * - $bus     - 事件总线
 * - $vars    - 变量快捷访问
 *
 * 安全性：
 * - new Function 比 eval 更安全（独立作用域，无法访问闭包变量）
 * - 但仍有风险，适合内部人员使用，不建议开放给外部用户
 * - 如需执行不受信任的代码，应使用 iframe sandbox 或 Web Worker
 */

import type { ActionHandler } from '../executor';
import type { CustomCodeActionConfig } from '../../types';

export const customCodeAction: ActionHandler = async (
  action,
  context,
  event,
) => {
  const config = action.config as unknown as CustomCodeActionConfig;
  if (!config.code?.trim()) return;

  // variables 需要通过单独的方法逐个获取
  // 这里提供当前页面变量的快照
  const varsMap: Record<string, unknown> = {};
  // 预置常用变量给用户脚本使用
  const presetKeys: string[] = [
    // 可以在运行时由宿主注入更多预设变量名
  ];
  presetKeys.forEach((key) => {
    const val = context.variables.get(key);
    if (val !== undefined) varsMap[key] = val;
  });

  const sandboxVars: Record<string, unknown> = {
    context,
    event,
    variables: varsMap,
    // 快捷方式
    $toast: context.toast,
    $navigate: context.navigate,
    $modals: context.modals,
    $bus: context.eventBus,
    $vars: {
      get: (key: string) => context.variables.get(key),
      set: (key: string, value: unknown) => context.variables.set(key, value),
    },
  };

  try {
    const fn = new Function(
      ...Object.keys(sandboxVars),
      config.code,
    );
    await fn(...Object.values(sandboxVars));
  } catch (err) {
    console.error('[PageSchema] 自定义代码执行失败:', err);
  }
};
