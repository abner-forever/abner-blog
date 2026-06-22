/**
 * 页面导航动作
 *
 * 支持：
 * - _self：当前窗口跳转（SPA 路由或 window.location）
 * - _blank：新窗口打开
 * - params：向 URL 追加查询参数
 */

import type { ActionHandler } from '../executor';
import type { NavigateActionConfig } from '../../types';

export const navigateAction: ActionHandler = (action, context) => {
  const config = action.config as unknown as NavigateActionConfig;

  let url = config.url;

  // 拼接查询参数
  if (config.params && Object.keys(config.params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${searchParams.toString()}`;
  }

  context.navigate(url, config.target ?? '_self');
};
