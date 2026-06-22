/**
 * 返回上一页动作
 *
 * 调用 history.back() 返回上一页。
 * 支持 fallback URL：如果无历史记录则跳转到指定 URL。
 */

import type { ActionHandler } from '../executor';
import type { NavigateActionConfig } from '../../types';

export const backAction: ActionHandler = (action, context) => {
  if (typeof window !== 'undefined') {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // 无历史记录，使用 fallback URL
      const config = action.config as unknown as NavigateActionConfig | undefined;
      if (config?.url) {
        context.navigate(config.url, '_self');
      }
    }
  }
};
