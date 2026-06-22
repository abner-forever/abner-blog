/**
 * Toast 消息提示动作
 *
 * 在页面中显示一条短暂的消息提示，自动消失。
 * 对应 Ant Design message / 浏览器原生 toast 等实现。
 */

import type { ActionHandler } from '../executor';
import type { ToastActionConfig } from '../../types';

export const toastAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as ToastActionConfig;

  switch (config.type) {
    case 'success':
      context.toast.success(config.message);
      break;
    case 'error':
      context.toast.error(config.message);
      break;
    case 'info':
      context.toast.info(config.message);
      break;
    case 'warning':
      context.toast.warning(config.message);
      break;
    default:
      context.toast.info(config.message);
      break;
  }
};
