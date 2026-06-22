/**
 * 内置动作处理器注册
 *
 * 将所有内置动作处理器注册到全局 actionRegistry。
 * 宿主应用在初始化时调用 registerBuiltInActions() 注册内置动作，
 * 之后可以通过 actionRegistry.register() 扩展自定义动作。
 */

import { actionRegistry } from '../executor';
import { toastAction } from './toast';
import { navigateAction } from './navigate';
import { openModalAction, closeModalAction } from './modal';
import { confirmAction } from './confirm';
import { setVariableAction } from './set-variable';
import { callApiAction } from './call-api';
import { dispatchEventAction } from './dispatch-event';
import { reloadAction } from './reload';
import { backAction } from './back';
import { scrollToAction } from './scroll-to';
import { customCodeAction } from './custom-code';

/**
 * 注册所有内置动作处理器
 * 在应用初始化时调用一次即可
 */
export function registerBuiltInActions(): void {
  actionRegistry.registerAll({
    toast: toastAction,
    navigate: navigateAction,
    'open-modal': openModalAction,
    'close-modal': closeModalAction,
    confirm: confirmAction,
    'set-variable': setVariableAction,
    'call-api': callApiAction,
    'dispatch-event': dispatchEventAction,
    reload: reloadAction,
    back: backAction,
    'scroll-to': scrollToAction,
    'custom-code': customCodeAction,
  });
}
