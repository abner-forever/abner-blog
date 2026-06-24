/**
 * 弹窗开关动作
 *
 * 由宿主实现 ModalCapability.open/close 来对接具体弹窗方案
 * （Ant Design Modal、自定义弹窗等）。
 *
 * open-modal 执行时：
 * 1. 调用 context.modals.open 更新 modalStates（显示弹窗）
 * 2. 将 data 写入 variables，命名空间：modal.{modalId}.{key}
 */

import type { ActionHandler } from '../executor';
import type { ModalActionConfig } from '../../types';

export const openModalAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as ModalActionConfig;

  // 将 data 写入 variables（命名空间：modal.{modalId}.{key}）
  if (config.data) {
    Object.entries(config.data).forEach(([key, value]) => {
      context.variables.set(`modal.${config.modalId}.${key}`, value);
    });
  }

  // 更新 modalStates（显示弹窗）
  context.modals.open(config.modalId, config.data);
};

export const closeModalAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as ModalActionConfig;
  context.modals.close(config.modalId);
};
