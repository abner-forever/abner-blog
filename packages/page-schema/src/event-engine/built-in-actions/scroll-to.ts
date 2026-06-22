/**
 * 滚动到元素动作
 *
 * 将页面平滑滚动到指定选择器匹配的元素位置。
 */

import type { ActionHandler } from '../executor';
import type { ScrollToActionConfig } from '../../types';

export const scrollToAction: ActionHandler = (action) => {
  const config = action.config as unknown as ScrollToActionConfig;

  if (typeof document === 'undefined') return;

  const element = document.querySelector(config.selector);
  if (!element) return;

  element.scrollIntoView({
    behavior: config.behavior ?? 'smooth',
    block: 'start',
  });
};
