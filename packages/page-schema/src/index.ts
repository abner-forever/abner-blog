/**
 * @abner-blog/page-schema
 *
 * 页面编辑系统 JSON Schema 类型定义与渲染引擎
 * 提供类型系统 + 渲染引擎 + 组件注册表
 *
 * 模块导出说明：
 * - types: 核心类型定义（SchemaNode, PageSchema, 组件Props接口, 注册表等）
 * - provider: RendererProvider (Context + extraComponents)
 * - renderer: PageRenderer (递归渲染引擎)
 * - middleware: 中间件系统（StyleInjector, EventHandler）
 * - event-engine: 事件执行引擎（ActionContext, Executor, 内置动作）
 * - components: 业务渲染组件（分批实现中）
 * - utils: 工具函数（样式处理等）
 */

// 核心类型
export * from './types';

// 事件引擎
export * from './event-engine';

// 渲染引擎
export { RendererProvider, useRendererContext, ModalProvider, ModalPortals, useModalContext } from './provider';
export type { RendererProviderProps, RendererContextValue, ModalProviderProps, ModalContextValue, ModalApi } from './provider';
export { PageRenderer } from './renderer';
export type { PageRendererProps } from './renderer';

// 中间件系统
export { applyMiddlewares, isMiddlewarePass } from './middleware/types';
export { styleInjector } from './middleware/style-injector';
export { createEventHandler } from './middleware/event-handler';

// 响应式变量存储
export { VariableStore, VariableProvider, useVariableStore, useVariableSubscription, extractNodeVariableDeps } from './variable-store';

// 数据来源初始化
export { resolveUrlMappings } from './resolve-url-mappings';
export { executeDataSources } from './execute-data-sources';
export { resolveTemplateVars, resolveObjectTemplates } from './resolve-template';
export type { PageVariables, UrlMappingItem, DataSourceItem } from './types';
export { animationInjector } from './middleware/animation';
export type { AnimationConfig } from './middleware/animation';
export { createAnalyticsMiddleware } from './middleware/analytics';
export type { AnalyticsEvent, AnalyticsTracker, AnalyticsNodeProps } from './middleware/analytics';
export { createVariableParserMiddleware, createDynamicVariableParserMiddleware } from './middleware/variable-parser';
export { createConditionMiddleware, createDynamicConditionMiddleware } from './middleware/condition';
export type { ConditionConfig, ConditionOperator } from './middleware/condition';
export type { Middleware } from './types';

// 组件
export {
  UnknownComponent,
  Container,
  Section,
  Row,
  Column,
  Text,
  Image,
  Button,
  Divider,
  Spacer,
  Video,
  BilibiliVideo,
  TencentVideo,
  Card,
  Accordion,
  Tabs,
  Carousel,
  Map,
  NavMenu,
  NavLink,
  HtmlEmbed,
  Form,
  useFormContext,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormSubmit,
  DataList,
  DataBadge,
  Modal,
} from './components';
export type { ModalComponentProps } from './components';

// 工具
export {
  cssTextToStyle,
  mergeStyles,
  buildClassName,
} from './utils/styles';
