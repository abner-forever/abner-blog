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

import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
import { applyMiddlewares } from './middleware/types';
import { createEventHandler } from './middleware/event-handler';
import { Modal } from './components';
import { VariableStore, useVariableSubscription, extractNodeVariableDeps } from './variable-store';
import { VariableContext } from './variable-store';
import { resolveUrlMappings } from './resolve-url-mappings';
import { executeDataSources } from './execute-data-sources';
import { executeActions } from './event-engine/executor';

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
  /** 响应式变量存储（组件间通信的数据源） */
  variableStore: VariableStore | null;
}

const RendererContext = React.createContext<RendererContextValue | null>(null);

/* ==================== Modal Context ==================== */

export interface ModalContextValue {
  /** 打开弹窗 */
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  /** 关闭弹窗 */
  closeModal: (modalId: string) => void;
  /** 获取所有弹窗节点 */
  modalNodes: SchemaNode[];
  /** 获取弹窗可见性状态 */
  isModalVisible: (modalId: string) => boolean;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

/**
 * 获取 Modal Context
 * 如果不在 ModalProvider 内使用，会抛出错误
 */
export function useModalContext(): ModalContextValue {
  const ctx = React.useContext(ModalContext);
  if (!ctx) {
    throw new Error(
      'useModalContext 必须在 <ModalProvider> 内部使用',
    );
  }
  return ctx;
}

/* ==================== Modal API 类型 ==================== */

/** Modal 操作 API（供 actionContextFactory 使用） */
export interface ModalApi {
  open: (modalId: string, data?: Record<string, unknown>) => void;
  close: (modalId: string) => void;
}

/* ==================== ModalProvider ==================== */

export interface ModalProviderProps {
  /** 页面 Schema（用于扫描 modal 节点） */
  schema: PageSchema;
  /**
   * 渲染子组件，接收 modalApi 用于传递给 RendererProvider
   *
   * 用法：
   * ```tsx
   * <ModalProvider schema={schema}>
   *   {(modalApi) => (
   *     <RendererProvider schema={schema} modalApi={modalApi} ...>
   *       <PageRenderer />
   *     </RendererProvider>
   *   )}
   * </ModalProvider>
   * ```
   */
  children: React.ReactNode | ((modalApi: ModalApi) => React.ReactNode);
}

/**
 * Modal 状态管理 Provider
 *
 * 职责：
 * 1. 扫描 schema 中 type === 'modal' 的节点
 * 2. 管理所有弹窗的可见性状态（modalStates）
 * 3. 暴露 openModal / closeModal 方法
 * 4. 在顶层通过 Portal 渲染所有弹窗
 *
 * 用法：
 * ```tsx
 * <ModalProvider schema={pageSchema}>
 *   {(modalApi) => (
 *     <RendererProvider schema={pageSchema} modalApi={modalApi} ...>
 *       <PageRenderer />
 *     </RendererProvider>
 *   )}
 * </ModalProvider>
 * ```
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({
  schema,
  children,
}) => {
  const [modalStates, setModalStates] = useState<Record<string, boolean>>({});

  // 扫描 schema 中的 modal 节点（根的直接子节点）
  const modalNodes = useMemo(() => {
    if (!schema.root?.children) return [];
    return schema.root.children.filter((child) => child.type === 'modal');
  }, [schema.root]);

  // 稳定的 open/close 方法（函数式 setState，无外部依赖）
  //
  // 注意：schema 中的弹窗节点 ID 有两种格式需要兼容：
  //   旧格式（v1）：gjs_{ccid}，由旧版 generateComponentId 生成
  //   新格式（v2）：comp.getId()，由新版 generateComponentId 生成
  // 而事件配置中的 modalId（来自 getModalList）统一使用 comp.getId()（无 gjs_ 前缀）。
  // 因此 openModal 和 closeModal 需要同时处理两种 ID 格式。
  const openModal = useCallback((modalId: string, _data?: Record<string, unknown>) => {
    setModalStates((prev) => {
      const updates: Record<string, boolean> = { [modalId]: true };
      // 兼容旧 schema（gjs_ 前缀格式的节点 ID）
      if (!modalId.startsWith('gjs_')) {
        updates[`gjs_${modalId}`] = true;
      }
      return { ...prev, ...updates };
    });
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setModalStates((prev) => {
      const updates: Record<string, boolean> = { [modalId]: false };
      // 兼容旧 schema（openModal 设置的 gjs_ 前缀状态）
      if (!modalId.startsWith('gjs_')) {
        updates[`gjs_${modalId}`] = false;
      }
      return { ...prev, ...updates };
    });
  }, []);

  const isModalVisible = useCallback(
    (modalId: string) => !!modalStates[modalId],
    [modalStates],
  );

  const modalApi = useMemo<ModalApi>(
    () => ({ open: openModal, close: closeModal }),
    [openModal, closeModal],
  );

  const contextValue = useMemo<ModalContextValue>(
    () => ({ openModal, closeModal, modalNodes, isModalVisible }),
    [openModal, closeModal, modalNodes, isModalVisible],
  );

  // 支持 render function 子组件（传递 modalApi）或普通子组件
  const renderedChildren = typeof children === 'function'
    ? (children as (modalApi: ModalApi) => React.ReactNode)(modalApi)
    : children;

  return (
    <ModalContext.Provider value={contextValue}>
      {renderedChildren}
    </ModalContext.Provider>
  );
};

/**
 * Modal 子节点渲染器
 *
 * Modal 内部的子节点需要在 Portal 中渲染，
 * 但不能直接使用 RenderNode（因为脱离了 RendererProvider 的 DOM 树）。
 * 此组件使用 useRendererContext 获取注册表，递归渲染子节点。
 *
 * 注意：必须经过中间件链（与 RenderNode 一致），否则事件绑定不会生效。
 */
const ModalChildNode: React.FC<{ node: SchemaNode }> = ({ node }) => {
  const { registry, middlewares, actionContext } = useRendererContext();

  // Hooks 必须在条件返回前统一调用
  const varDeps = useMemo(() => extractNodeVariableDeps(node.props), [node]);
  const varSnapshot = useVariableSubscription(varDeps);
  const memoKey = useMemo(
    () => `${node.id || node.type}_${varSnapshot}`,
    [node, varSnapshot],
  );
  const allMiddlewares = useMemo(() => {
    if (!actionContext) return middlewares;
    return [createEventHandler(actionContext), ...middlewares];
  }, [middlewares, actionContext]);

  if (node.hidden) return null;

  // 创建组件渲染函数（中间件链末端 identity，产生真实 React 元素）
  const renderComponent = (n: SchemaNode): React.ReactNode => {
    const children = n.children?.map((child) => (
      <ModalChildNode key={child.id} node={child} />
    ));
    const Component = registry.get(n.type);
    if (!Component) {
      return <div>{children}</div>;
    }
    return <Component node={n}>{children}</Component>;
  };

  // 缓存中间件链结果
  const middlewareResult = useMemo(
    () => applyMiddlewares(node, allMiddlewares, renderComponent),
    [memoKey, node, allMiddlewares],
  );

  if (middlewareResult === null) return null;
  return middlewareResult;
};

/**
 * Modal Portal 渲染器
 *
 * 必须在 <RendererProvider> 内部使用。
 * 通过 ModalContext 获取弹窗的可见性状态和节点列表，
 * 通过 RendererContext 获取组件注册表来递归渲染弹窗内容。
 *
 * 弹窗内容通过 Portal 渲染到 document.body（由 Modal 组件内部实现），
 * 但 React context 仍然来自此组件的上下文（即 RendererProvider 内），
 * 因此 ModalChildNode 可以访问到完整的组件注册表。
 *
 * 用法：
 * ```tsx
 * <ModalProvider schema={schema}>
 *   {(modalApi) => (
 *     <RendererProvider schema={schema} modalApi={modalApi}>
 *       <PageRenderer />
 *       <ModalPortals />
 *     </RendererProvider>
 *   )}
 * </ModalProvider>
 * ```
 */
export const ModalPortals: React.FC = () => {
  const { modalNodes, isModalVisible, closeModal } = useModalContext();
  // ModalChildNode 通过 useRendererContext() 获取组件注册表，
  // 因此 ModalPortals 只需确保自身在 <RendererProvider> 内部即可。

  return (
    <>
      {modalNodes.map((node) => (
        <Modal
          key={node.id}
          node={node}
          visible={isModalVisible(node.id)}
          onClose={() => closeModal(node.id)}
        >
          {node.children?.map((child) => (
            <ModalChildNode key={child.id} node={child} />
          ))}
        </Modal>
      ))}
    </>
  );
};

/* ==================== Provider Props ==================== */

export interface RendererProviderProps {
  /** 页面 Schema */
  schema: PageSchema;
  /** 额外的组件注册（可选，运行时注入覆盖内置组件） */
  extraComponents?: Record<string, ComponentRenderer>;
  /** 额外的中间件（可选） */
  extraMiddlewares?: Middleware[];
  /**
   * Modal API（可选）
   *
   * 由 ModalProvider 提供，用于在事件执行上下文中注入 modal 能力。
   * 当提供 actionContextFactory 时，modalApi 会被传入工厂函数。
   */
  modalApi?: ModalApi;
  /**
   * 变量存储实例（可选）
   *
   * 提供此实例时，页面引擎使用它作为组件间通信的变量数据源。
   * 会将 store 的 set/get/delete/clear 自动注入到 ActionContext.variables，
   * 并放入 RendererContext 供 RenderNode 做细粒度订阅。
   *
   * 宿主应用通过此方式创建中间件：
   * ```tsx
   * const store = useMemo(() => new VariableStore(), []);
   * const variableParser = useMemo(
   *   () => createDynamicVariableParserMiddleware(() => store),
   *   [store],
   * );
   * ```
   *
   * 不提供时，Provider 内部创建一个默认 store（不影响功能，但无法在外部访问）。
   */
  variableStore?: VariableStore;
  /**
   * 事件执行上下文工厂（可选）
   *
   * 提供此工厂时，事件系统自动启用。
   * 工厂接收当前渲染的根节点，返回 ActionContext。
   * 注意：variables 字段会被 variableStore 的实现覆盖，
   * 因此工厂中只需提供 toast/navigate/modals/eventBus 等宿主能力。
   *
   * ```tsx
   * <RendererProvider
   *   schema={schema}
   *   actionContextFactory={(rootNode) => ({
   *     sourceNode: rootNode,
   *     toast: { success: message.success, ... },
   *     navigate: ...,
   *     // variables 会被自动注入
   *   })}
   * >
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
  variableStore: externalStore,
  children,
}) => {
  // 确保内置动作已注册（幂等，多次调用不会重复注册）
  registerBuiltInActions();

  // 响应式变量存储：优先使用外部传入的，否则内部创建
  // 抽出为独立 useMemo，便于 useEffect 初始化阶段访问
  const variableStore = useMemo(
    () => externalStore ?? new VariableStore(),
    [externalStore],
  );

  // 创建事件执行上下文
  // 注：store-backed variables 会覆盖 host 提供的 variables，
  // 确保 set-variable 动作写入 store 后能触发订阅者的重渲染。
  const actionContext = useMemo(() => {
    if (!actionContextFactory) return null;
    const hostCtx = actionContextFactory(schema.root);
    if (!hostCtx) return null;
    return {
      ...hostCtx,
      variables: {
        get: (key: string) => variableStore.get(key),
        set: (key: string, value: unknown) => {
          variableStore.set(key, value);
        },
        delete: (key: string) => {
          variableStore.delete(key);
        },
        clear: () => {
          variableStore.clear();
        },
      },
    };
  }, [actionContextFactory, schema.root, variableStore]);

  const contextValue = useMemo<RendererContextValue>(() => ({
    registry:
      extraComponents && Object.keys(extraComponents).length > 0
        ? new DefaultComponentRegistry(extraComponents)
        : new DefaultComponentRegistry(),
    middlewares: extraMiddlewares ?? [],
    css: schema.css,
    actionContext,
    variableStore,
  }), [
    extraComponents,
    extraMiddlewares,
    schema.css,
    actionContext,
    variableStore,
  ]);

  // 初始化流水线：initial → urlMapping → onPageLoad → dataSources
  //
  // 页面挂载时自动执行：
  //   ① store.setMany(initial)              ← 同步，硬编码默认值
  //   ② resolveUrlMappings(urlMapping)       ← 同步，URL 参数→变量
  //   ③ events.onPageLoad                    ← 同步，执行页面加载事件动作
  //   ④ executeDataSources(dataSources)      ← 异步，API 串行请求
  //
  // schema.variables 变化时重新执行（编辑器预览场景）。
  useEffect(() => {
    const variablesConfig = schema.variables;

    // Phase 1: 初始变量值落盘
    if (variablesConfig?.initial) {
      variableStore.setMany(variablesConfig.initial);
    }

    // Phase 2: URL 参数映射
    if (variablesConfig?.urlMapping?.length) {
      // 使用页面显式配置的映射规则
      resolveUrlMappings(variablesConfig.urlMapping, variableStore);
    } else {
      // 自动兜底：当页面未配置 urlMapping 但 URL 有参数时，
      // 自动全部捕获到 query 变量，使 {{query.xxx}} 零配置可用
      const hasParams = typeof window !== 'undefined' && window.location.search.length > 1;
      if (hasParams) {
        resolveUrlMappings([{ as: 'query', captureAll: true }], variableStore);
      }
    }

    // Phase 3: 页面加载事件（在 initial + urlMapping 完成后触发）
    // 此时所有同步变量已就绪，动作配置中的 {{query.xxx}} 可正常解析
    if (variablesConfig?.events?.onPageLoad?.length && actionContext) {
      executeActions(variablesConfig.events.onPageLoad, actionContext, null as unknown as Event);
    }

    // Phase 4: API 数据源（需要 actionContext 执行 onSuccess/onError 动作链）
    if (variablesConfig?.dataSources?.length && actionContext) {
      executeDataSources(
        variablesConfig?.dataSources,
        variableStore,
        actionContext,
      ).catch((err) => {
        console.error('[RendererProvider] dataSource execution error:', err);
      });
    }
  }, [schema.variables, variableStore, actionContext]);

  return (
    <RendererContext.Provider value={contextValue}>
      {/* VariableContext 确保 useVariableSubscription 能获取到 store 实例 */}
      <VariableContext.Provider value={contextValue.variableStore}>
        {children}
      </VariableContext.Provider>
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
