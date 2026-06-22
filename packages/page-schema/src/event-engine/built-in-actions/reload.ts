/**
 * 刷新页面动作
 *
 * 调用 location.reload() 刷新当前页面。
 */

import type { ActionHandler } from '../executor';

export const reloadAction: ActionHandler = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};
