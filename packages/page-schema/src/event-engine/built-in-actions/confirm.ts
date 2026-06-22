/**
 * 确认对话框动作
 *
 * 弹出一个确认/取消对话框。
 * 用户确认后执行 onConfirm 子动作链，取消后执行 onCancel 子动作链。
 */

import type { ActionHandler } from '../executor';
import { executeActions } from '../executor';
import type { ConfirmActionConfig } from '../../types';
import type { ActionContext } from '../action-context';

export const confirmAction: ActionHandler = async (action, context, event) => {
  const config = action.config as unknown as ConfirmActionConfig;

  // 通过变量的方式让宿主提供 confirm 弹窗能力
  // 宿主通过扩展 ActionContext 或自定义动作来实现 UI 弹窗
  // 这里采用更通用的方式：触发事件让宿主监听
  const confirmed = await showConfirmDialog(config, context);

  if (confirmed && config.onConfirm?.length) {
    await executeActions(config.onConfirm, context, event);
  } else if (!confirmed && config.onCancel?.length) {
    await executeActions(config.onCancel, context, event);
  }
};

/**
 * 显示确认对话框
 *
 * 通过 eventBus 派发自定义事件让宿主处理确认弹窗 UI，
 * 宿主监听 'page-schema:confirm' 事件，调用 resolve(true/false)。
 *
 * 兜底方案：使用浏览器原生 confirm
 */
function showConfirmDialog(
  config: ConfirmActionConfig,
  context: ActionContext,
): Promise<boolean> {
  return new Promise((resolve) => {
    // 尝试使用 eventBus 让宿主处理（优先级高）
    let resolved = false;

    const unlisten = context.eventBus.on(
      'page-schema:confirm:resolve',
      (result) => {
        if (!resolved) {
          resolved = true;
          unlisten();
          resolve(result === true);
        }
      },
    );

    context.eventBus.emit('page-schema:confirm', {
      title: config.title ?? '确认',
      content: config.content,
      confirmText: config.confirmText ?? '确定',
      cancelText: config.cancelText ?? '取消',
      resolve: true, // 标记宿主可用 eventBus 响应
    });

    // 超时兜底：如果宿主 100ms 内未处理，使用浏览器原生 confirm
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unlisten();
        const result = window.confirm(
          `${config.title ? config.title + '\n' : ''}${config.content}`,
        );
        resolve(result);
      }
    }, 100);
  });
}
