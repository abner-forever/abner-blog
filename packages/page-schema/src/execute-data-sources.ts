/**
 * execute-data-sources — API 数据源执行器
 *
 * 按序执行 PageSchema.variables.dataSources 中的 API 请求，
 * 将响应写入 VariableStore，支持：
 * - 串行执行（按数组顺序）
 * - parallelGroup 内并行
 * - {{varName}} 模板语法解析 url
 * - onSuccess / onError 动作链（复用 EventAction[]）
 *
 * 在 RendererProvider 初始化阶段（Phase 3）被调用。
 */

import type { DataSourceItem } from './types';
import type { VariableStore } from './variable-store';
import type { ActionContext } from './event-engine/action-context';
import { executeActions } from './event-engine/executor';

/* ==================== 常量 ==================== */

/** 变量模板正则：匹配 {{variableName}} */
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/* ==================== 模板解析 ==================== */

/**
 * 替换字符串中的 {{varName}} 模板变量
 */
function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
): string {
  return template.replace(VARIABLE_REGEX, (_, varName: string) => {
    const trimmed = varName.trim();
    if (trimmed in variables && variables[trimmed] != null) {
      return String(variables[trimmed]);
    }
    return '';
  });
}

/* ==================== 单次请求 ==================== */

/**
 * 执行一个数据源请求
 *
 * @returns 成功返回响应数据，失败返回 undefined
 */
async function executeSingleSource(
  source: DataSourceItem,
  store: VariableStore,
  actionContext: ActionContext,
): Promise<unknown> {
  // 解析 url 中的 {{varName}} 模板变量
  const resolvedUrl = resolveTemplate(source.url, store.getAll());

  const fetchOptions: RequestInit = {
    method: source.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(source.headers ?? {}),
    },
  };

  if (source.body && source.method !== 'GET') {
    fetchOptions.body = JSON.stringify(source.body);
  }

  try {
    const response = await fetch(resolvedUrl, fetchOptions);

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

    // 响应存入变量
    if (source.assignTo) {
      store.set(source.assignTo, data);
    }

    // 执行成功子动作链（无原始 DOM 事件，传 null）
    if (source.onSuccess?.length) {
      await executeActions(source.onSuccess, actionContext, null as unknown as Event);
    }

    return data;
  } catch (err) {
    // 执行失败子动作链（无原始 DOM 事件，传 null）
    if (source.onError?.length) {
      await executeActions(source.onError, actionContext, null as unknown as Event);
    }
    return undefined;
  }
}

/* ==================== 批处理 ==================== */

/**
 * 将连续的同组数据源按 batch 分组
 *
 * 例如：
 *   [A(无group), B(g1), C(g1), D(无group), E(g2), F(g2)]
 *   → [[A], [B, C], [D], [E, F]]
 */
function groupIntoBatches(sources: DataSourceItem[]): DataSourceItem[][] {
  const batches: DataSourceItem[][] = [];
  let currentBatch: DataSourceItem[] = [];
  let currentGroup: string | undefined;

  for (const source of sources) {
    if (source.parallelGroup === currentGroup) {
      // 延续当前 batch
      currentBatch.push(source);
    } else {
      // 新 batch
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      currentBatch = [source];
      currentGroup = source.parallelGroup;
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

/* ==================== 主函数 ==================== */

/**
 * 执行所有 API 数据源
 *
 * 按数组顺序执行，同 parallelGroup 的数据源并行执行。
 * 每个数据源完成后，将响应写入 VariableStore 并触发订阅者的重渲染。
 *
 * @param sources - 数据源配置数组
 * @param store - VariableStore 实例
 * @param actionContext - 事件执行上下文（用于 onSuccess/onError 动作链）
 */
export async function executeDataSources(
  sources: DataSourceItem[],
  store: VariableStore,
  actionContext: ActionContext,
): Promise<void> {
  if (!sources.length) return;

  const batches = groupIntoBatches(sources);

  for (const batch of batches) {
    if (batch.length === 1) {
      // 单个执行
      await executeSingleSource(batch[0], store, actionContext);
    } else {
      // 同组并行
      await Promise.all(
        batch.map((source) => executeSingleSource(source, store, actionContext)),
      );
    }
  }
}
