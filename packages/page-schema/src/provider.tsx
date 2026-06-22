/**
 * RendererProvider
 *
 * 渲染引擎的顶层 Context 提供者。
 * 负责提供：
 * - ComponentRegistry：组件注册表（含内置组件 + extraComponents）
 * - middlewares：中间件链
 * - css：全局 CSS
 * - actionContext：事件执行上下文（如提供 factory 则自动创建）
 *
 * 使用 React Context 传递，确保子树所有 PageRenderer 共享同一份配置。
 * Context 值对引用稳定性做了保证（避免不必要的重渲染）。
 */

import React, { useMemo } from 'react';
import type {
  PageSchema,
  ComponentRegistry,
  ComponentRenderer,
  Middleware,
  SchemaNode,
} from './types';
import { DefaultComponentRegistry } from './types';
import type { ActionContext } from './event-engine/action-context';
import { registerBuiltInActions } from './event-engine/built-in-actions';
import { actionRegistry } from './event-engine/executor';

/* ==================== Context 定义 ==================== */

export interface RendererContextValue {
  /** 组件注册表 */
  registry: ComponentRegistry;
  /** 中间件列表 */
  middlewares: Middleware[];
  /** 全局 CSS */
  css?: string;
  /** 事件执行上下文（由事件中间件使用） */
  actionContext: ActionContext | null;
}

const RendererContext = React.createContext<RendererContextValue | null>(null);

/* ==================== Provider Props ==================== */

export interface RendererProviderProps {
  /** 页面 Schema */
  schema: PageSchema;
  /** 额外的组件注册（可选，运行时注入覆盖内置组件） */
  extraComponents?: Record<string, ComponentRenderer>;
  /** 额外的中间件（可选） */
  extraMiddlewares?: Middleware[];
  /**
   * 事件执行上下文工厂（可选）
   *
   * 提供此工厂时，事件系统自动启用。
   * 工厂接收当前渲染的根节点和动作注册表，返回 ActionContext。
   *
   * 宿主应用在此工厂中注入具体能力（toast/navigate/modals 等）：
   * ```tsx
   * <RendererProvider
   *   schema={schema}
   *   actionContextFactory={(rootNode) => ({
   *     sourceNode: rootNode,
   *     toast: { success: message.success, error: message.error, ... },
   *     navigate: (url) => router.push(url),
   *     ...
   *   })}
   * >
   *   <PageRenderer />
   * </RendererProvider>
   * ```
   */
  actionContextFactory?: (rootNode: SchemaNode) => ActionContext;
  /** 子组件 */
  children: React.ReactNode;
}

/* ==================== Provider 组件 ==================== */

/**
 * 渲染引擎 Provider
 *
 * 包裹需要渲染 Schema 的组件树，提供注册表和中间件配置。
 *
 * 用法：
 * ```tsx
 * <RendererProvider schema={pageSchema}>
 *   <PageRenderer />
 * </RendererProvider>
 * ```
 */
export const RendererProvider: React.FC<RendererProviderProps> = ({
  schema,
  extraComponents,
  extraMiddlewares,
  actionContextFactory,
  children,
}) => {
  const contextValue = useMemo<RendererContextValue>(() => {
    // 确保内置动作已注册（幂等，多次调用不会重复注册）
    registerBuiltInActions();

    // 构建注册表：内置组件 + 扩展组件
    const registry =
      extraComponents && Object.keys(extraComponents).length > 0
        ? new DefaultComponentRegistry(extraComponents)
        : new DefaultComponentRegistry();

    // 创建事件执行上下文
    const actionContext = actionContextFactory
      ? actionContextFactory(schema.root)
      : null;

    return {
      registry,
      middlewares: extraMiddlewares ?? [],
      css: schema.css,
      actionContext,
    };
  }, [
    schema.css,
    schema.root,
    extraComponents,
    extraMiddlewares,
    actionContextFactory,
  ]);

  return (
    <RendererContext.Provider value={contextValue}>
      {children}
    </RendererContext.Provider>
  );
};

/* ==================== Hook ==================== */

/**
 * 获取渲染引擎 Context
 * 如果不在 RendererProvider 内使用，会抛出错误
 */
export function useRendererContext(): RendererContextValue {
  const ctx = React.useContext(RendererContext);
  if (!ctx) {
    throw new Error(
      'useRendererContext 必须在 <RendererProvider> 内部使用',
    );
  }
  return ctx;
}
