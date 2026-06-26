/**
 * VariableStore — 响应式变量存储
 *
 * 替代原有的 pageVarsRef + setVarVersion 模式，
 * 提供基于 key 的发布订阅能力，结合 useSyncExternalStore
 * 实现细粒度的组件重渲染。
 *
 * 使用方式：
 * - RendererProvider 自动创建此 store 实例，并注入到 ActionContext.variables
 * - 中间件通过 RendererContext 获取 store 并读取变量
 * - 每个 RenderNode 通过 useVariableSubscription 按需订阅变量
 *
 * 架构变化：
 *   Before: pageVarsRef → setVarVersion(n+1) → 全树 re-render
 *   After:  VariableStore → notify subscribers → 仅依赖该变量的节点 re-render
 */

import React, { createContext, useContext, useSyncExternalStore, useRef } from 'react';

/* ==================== 类型定义 ==================== */

/** 订阅通知回调 */
type StoreListener = () => void;

/* ==================== Store 实现 ==================== */

export class VariableStore {
  private state: Record<string, unknown> = {};
  private keySubs = new Map<string, Set<StoreListener>>();
  private allSubs = new Set<StoreListener>();

  /** 获取单个变量值 */
  get(key: string): unknown {
    return this.state[key];
  }

  /** 获取全部变量 */
  getAll(): Record<string, unknown> {
    return { ...this.state };
  }

  /** 设置单个变量值，通知该 key 的订阅者 */
  set(key: string, value: unknown): void {
    this.state[key] = value;
    this.keySubs.get(key)?.forEach((cb) => cb());
    this.allSubs.forEach((cb) => cb());
  }

  /** 批量设置变量，只对变化的 key 发送通知 */
  setMany(entries: Record<string, unknown>): void {
    const changedKeys = Object.keys(entries);
    Object.assign(this.state, entries);
    changedKeys.forEach((key) => {
      this.keySubs.get(key)?.forEach((cb) => cb());
    });
    this.allSubs.forEach((cb) => cb());
  }

  /** 删除变量 */
  delete(key: string): void {
    delete this.state[key];
    this.keySubs.get(key)?.forEach((cb) => cb());
    this.allSubs.forEach((cb) => cb());
  }

  /** 清空所有变量 */
  clear(): void {
    this.state = {};
    this.allSubs.forEach((cb) => cb());
  }

  /** 订阅指定 key 的变化 */
  subscribeKey(key: string, listener: StoreListener): () => void {
    if (!this.keySubs.has(key)) {
      this.keySubs.set(key, new Set());
    }
    this.keySubs.get(key)!.add(listener);
    return () => {
      this.keySubs.get(key)?.delete(listener);
    };
  }

  /** 订阅所有变量变化（兜底订阅） */
  subscribeAll(listener: StoreListener): () => void {
    this.allSubs.add(listener);
    return () => {
      this.allSubs.delete(listener);
    };
  }

  /** 生成指定 key 的快照 JSON，用于 useSyncExternalStore 的快照比较 */
  makeSnapshot(keys: string[]): string {
    if (keys.length === 0) return '';
    const obj: Record<string, unknown> = {};
    for (const key of keys) {
      obj[key] = this.state[key];
    }
    return JSON.stringify(obj);
  }
}

/* ==================== React Context ==================== */

export const VariableContext = createContext<VariableStore | null>(null);

/* ==================== Provider ==================== */

/**
 * VariableProvider — 包裹需要变量订阅的子组件
 *
 * 注意：在 page-schema 的正常使用流程中，
 * RendererProvider 内部已经创建了 VariableStore 实例，
 * 因此大多数情况不需要手动包裹此 Provider。
 *
 * 仅在需要独立使用 VariableStore 且不在 RendererProvider 子树内时使用。
 */
export const VariableProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storeRef = useRef<VariableStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new VariableStore();
  }
  return React.createElement(
    VariableContext.Provider,
    { value: storeRef.current },
    children,
  );
};

/* ==================== 依赖提取 ==================== */

/** 变量模板正则：匹配 {{variableName}} */
export const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * 从 SchemaNode 中提取所有变量依赖
 *
 * 用于 RenderNode 确定需要订阅哪些变量。
 * 扫描两个方面：
 * 1. props 中的 {{key}} 模板
 * 2. condition.field 条件变量
 *
 * @param props - SchemaNode 的 props
 * @returns 变量名列表（去重）
 *
 * @example
 * ```ts
 * extractNodeVariableDeps({
 *   content: "欢迎，{{username}}！",
 *   condition: { field: "role", operator: "eq", value: "admin" }
 * })
 * // => ['username', 'role']
 * ```
 */
export function extractNodeVariableDeps(
  props: Record<string, unknown>,
): string[] {
  const deps = new Set<string>();

  // 1. Scan props for {{key}} template variables
  for (const value of Object.values(props)) {
    if (typeof value === 'string') {
      const matches = value.match(VARIABLE_REGEX);
      if (matches) {
        for (const match of matches) {
          const key = match.slice(2, -2).trim();
          if (key) {
            // 支持 {{urlParams.title}} 点号路径：只以根 key 作为依赖
            deps.add(key.split('.')[0]);
          }
        }
      }
    }
  }

  // 2. Check condition field dependency
  const condition = props?.condition as { field?: string } | undefined;
  if (condition?.field) {
    deps.add(condition.field);
  }

  return [...deps];
}

/* ==================== React Hooks ==================== */

/**
 * useVariableStore — 获取 VariableStore 实例
 *
 * 在 RendererProvider 子树内始终可用。
 * 返回 null 表示不在 Provider 中（不会主动抛错，便于测试和开发）。
 */
export function useVariableStore(): VariableStore | null {
  return useContext(VariableContext);
}

/**
 * useVariableSubscription — 订阅指定变量集合
 *
 * 仅当 deps 中的变量值发生变化时，调用此 hook 的组件才会 re-render。
 * 使用 React 18 的 useSyncExternalStore 实现，无额外依赖。
 *
 * 工作原理：
 * 1. 调用 subscribe 注册 onStoreChange 回调
 * 2. 当变量变化时，store 通知 onStoreChange
 * 3. React 调用 getSnapshot 对比快照
 * 4. 快照不同 → 组件 re-render
 * 5. 快照相同 → 不 re-render（防抖了订阅 key 外的变化）
 *
 * @param deps - 依赖的变量名列表（空数组时永不触发更新）
 * @returns 当前变量值的快照 JSON
 */
export function useVariableSubscription(deps: string[]): string {
  const store = useContext(VariableContext);

  if (!store) {
    return '';
  }

  return useSyncExternalStore(
    (onStoreChange: () => void) => {
      if (deps.length === 0) return () => {}; // 无依赖，不订阅

      const unsubs = deps.map((key) => store.subscribeKey(key, onStoreChange));
      const unsubAll = store.subscribeAll(onStoreChange);
      return () => {
        unsubs.forEach((fn) => fn());
        unsubAll();
      };
    },
    () => store.makeSnapshot(deps),
  );
}
