/**
 * 弹窗开关动作
 *
 * 由宿主实现 ModalCapability.open/close 来对接具体弹窗方案
 * （Ant Design Modal、自定义弹窗等）。
 */

import type { ActionHandler } from '../executor';
import type { ModalActionConfig } from '../../types';

export const openModalAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as ModalActionConfig;
  context.modals.open(config.modalId, config.data);
};

export const closeModalAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as ModalActionConfig;
  context.modals.close(config.modalId);
};
