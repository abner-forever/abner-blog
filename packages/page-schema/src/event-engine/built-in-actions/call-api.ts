/**
 * 调用 API 动作
 *
 * 发起 AJAX 请求，支持：
 * - 多种 HTTP 方法（GET/POST/PUT/DELETE）
 * - 自定义请求头
 * - 请求体
 * - 响应存入页面变量（assignTo）
 * - 成功/失败子动作链（onSuccess/onError）
 */

import type { ActionHandler } from '../executor';
import { executeActions } from '../executor';
import type { CallApiActionConfig } from '../../types';

export const callApiAction: ActionHandler = async (action, context, event) => {
  const config = action.config as unknown as CallApiActionConfig;

  try {
    const fetchOptions: RequestInit = {
      method: config.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers ?? {}),
      },
    };

    if (config.body && config.method !== 'GET') {
      fetchOptions.body = JSON.stringify(config.body);
    }

    const response = await fetch(config.url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 尝试解析 JSON 响应，失败则用文本
    let data: unknown;
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // 响应存入页面变量
    if (config.assignTo) {
      context.variables.set(config.assignTo, data);
    }

    // 执行成功子动作链
    if (config.onSuccess?.length) {
      await executeActions(config.onSuccess, context, event);
    }
  } catch (err) {
    // 执行失败子动作链
    if (config.onError?.length) {
      await executeActions(config.onError, context, event);
    }
  }
};
