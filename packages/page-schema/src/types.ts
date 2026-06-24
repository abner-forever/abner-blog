/**
 * 页面 Schema 核心类型定义
 *
 * - SchemaNode: 组件树节点，定义了组件实例的全部属性
 * - ComponentSchema: 组件类型的 schema 描述，用于编辑器属性面板自动生成
 */

import type React from 'react';

/* ==================== 组件类型枚举 ==================== */

/** 组件类型常量（核心六个，扩展通过字符串） */
export const ComponentTypeConst = {
  CONTAINER: 'container',
  SECTION: 'section',
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  VIDEO: 'video',
  ROW: 'row',
  COLUMN: 'column',
  DIVIDER: 'divider',
  SPACER: 'spacer',
  BILIBILI_VIDEO: 'bilibili-video',
  TENCENT_VIDEO: 'tencent-video',
  CARD: 'card',
  ACCORDION: 'accordion',
  TABS: 'tabs',
  CAROUSEL: 'carousel',
  MAP: 'map',
  NAV_MENU: 'nav-menu',
  NAV_LINK: 'nav-link',
  HTML_EMBED: 'html-embed',
  MODAL: 'modal',
} as const;

/** 组件类型枚举 */
export enum ComponentType {
  /** 容器（自由布局） */
  CONTAINER = 'container',
  /** 区块（相对定位容器） */
  SECTION = 'section',
  /** 文本 */
  TEXT = 'text',
  /** 图片 */
  IMAGE = 'image',
  /** 按钮 */
  BUTTON = 'button',
  /** 视频 */
  VIDEO = 'video',
}

/* ==================== 值类型与格式 ==================== */

/** 值的类型 */
export enum ValueType {
  STRING = 'string',
  NUMBER = 'number',
  ARRAY = 'array',
  OBJECT = 'object',
  BOOLEAN = 'boolean',
  COLOR = 'color',
}

/** 编辑器输入格式 */
export enum Format {
  SINGLE_SELECT = 'single_select',
  MULTIPLE_SELECT = 'multiple_select',
  INPUT = 'input',
  NUMBER_INPUT = 'number_input',
  TEXT_AREA = 'text_area',
  COLOR = 'color',
  IMAGE = 'image',
  BACKGROUND = 'background',
  BOOLEAN = 'boolean',
}

/* ==================== Schema 属性定义 ==================== */

/** Schema 属性选项 */
export interface SchemaOption {
  label: string;
  value: string | number;
}

/** Schema 单个属性定义 */
export interface SchemaProperty {
  title: string;
  description?: string;
  type: ValueType;
  format?: Format;
  default?: unknown;
  options?: SchemaOption[];
  require?: boolean;
  /** 关联配置：当 relateKey 的值等于 relateShowValue 时才显示此属性 */
  relateKey?: string;
  relateShowValue?: unknown;
}

/** 组件类型的 Schema 定义 */
export interface ComponentSchema {
  title: string;
  description?: string;
  type: ValueType.OBJECT;
  properties: Record<string, ComponentSchema | SchemaProperty>;
}

/* ==================== 组件节点 ==================== */

/**
 * 组件节点 - 页面中每个组件实例对应一个节点
 */
export interface SchemaNode {
  /** 节点唯一标识 */
  id: string;
  /** 组件类型，对应 ComponentRegistry 中的 key */
  type: string;
  /** 组件属性（含 style + 各组件特有属性） */
  props: Record<string, unknown>;
  /** 子节点列表（容器组件） */
  children?: SchemaNode[];
  /** 组件类型的 schema 描述（用于编辑器属性面板） */
  componentSchema?: ComponentSchema;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 事件绑定列表（可序列化的事件配置，替代函数引用） */
  events?: EventBinding[];
}

/* ==================== 页面 Schema ==================== */

/** 页面 Meta 信息 */
export interface PageMeta {
  title?: string;
  description?: string;
}

/**
 * 页面 Schema - 页面完整的 JSON 描述
 * 整个页面渲染为一个 SchemaNode 树
 */
export interface PageSchema {
  /** 根节点（通常为 CONTAINER 类型） */
  root: SchemaNode;
  /** 全局 CSS */
  css?: string;
  /** 页面元信息 */
  meta?: PageMeta;
}

/* ==================== 组件 Props 接口契约 ==================== */

/** 文本组件预期 Props */
export interface TextNodeProps {
  content?: string;
  /** 渲染标签：h1-h6 | p | span */
  as?: string;
  style?: React.CSSProperties;
}

/** 图片组件预期 Props */
export interface ImageNodeProps {
  src?: string;
  alt?: string;
  lazy?: boolean;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  style?: React.CSSProperties;
}

/** 按钮组件预期 Props */
export interface ButtonNodeProps {
  text?: string;
  variant?: 'primary' | 'default' | 'text' | 'link';
  icon?: string;
  loading?: boolean;
  style?: React.CSSProperties;
}

/** 视频组件预期 Props */
export interface VideoNodeProps {
  src?: string;
  poster?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  style?: React.CSSProperties;
}

/** 分割线组件预期 Props */
export interface DividerNodeProps {
  color?: string;
  height?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

/** 间距组件预期 Props */
export interface SpacerNodeProps {
  height?: number;
}

/** 卡片组件预期 Props */
export interface CardNodeProps {
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description?: string;
  href?: string;
  style?: React.CSSProperties;
}

/** 手风琴组件预期 Props */
export interface AccordionNodeProps {
  /** 每个面板的配置 */
  items?: Array<{
    title: string;
    defaultOpen?: boolean;
  }>;
  style?: React.CSSProperties;
}

/** 标签页组件预期 Props */
export interface TabsNodeProps {
  /** 每个标签页标签 */
  tabLabels?: string[];
  activeIndex?: number;
  style?: React.CSSProperties;
}

/** 轮播图组件预期 Props */
export interface CarouselNodeProps {
  interval?: number;
  autoplay?: boolean;
  indicators?: boolean;
  /** 每个幻灯片的图片 URL */
  slides?: string[];
  style?: React.CSSProperties;
}

/** 地图组件预期 Props */
export interface MapNodeProps {
  src?: string;
  address?: string;
  zoom?: number;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

/** B站视频组件预期 Props */
export interface BilibiliVideoNodeProps {
  bvid?: string;
  aid?: number;
  page?: number;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

/** 腾讯视频组件预期 Props */
export interface TencentVideoNodeProps {
  vid?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

/** 导航菜单组件预期 Props */
export interface NavMenuNodeProps {
  sticky?: boolean;
  items?: Array<{
    label: string;
    href: string;
    target?: '_blank' | '_self';
  }>;
  style?: React.CSSProperties;
}

/** 导航链接组件预期 Props */
export interface NavLinkNodeProps {
  text?: string;
  href?: string;
  target?: '_blank' | '_self';
  style?: React.CSSProperties;
}

/** 自定义 HTML 组件预期 Props */
export interface HtmlEmbedNodeProps {
  html?: string;
  style?: React.CSSProperties;
}

/** 弹窗组件预期 Props */
export interface ModalNodeProps {
  /** 编辑器内标识（"确认弹窗"） */
  name?: string;
  /** 弹窗上显示的标题 */
  title?: string;
  /** 弹窗宽度，默认 520 */
  width?: number | string;
  /** 显示关闭按钮，默认 true */
  closable?: boolean;
  /** 点击遮罩关闭，默认 true */
  maskClosable?: boolean;
  /** ESC 关闭，默认 true */
  keyboard?: boolean;
  /** 显示 footer，默认 true */
  footer?: boolean;
  /** 动画类型，默认 fade */
  animation?: 'fade' | 'zoom' | 'slide';
  style?: React.CSSProperties;
}

/* ==================== 表单系列 Props ==================== */

/** 表单容器预期 Props */
export interface FormNodeProps {
  action?: string;
  method?: 'GET' | 'POST';
  /** 开启 API 模式时，表单位于此端点 */
  api?: string;
  submitLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  style?: React.CSSProperties;
}

/** 输入框预期 Props */
export interface FormInputNodeProps {
  label?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  style?: React.CSSProperties;
}

/** 多行文本预期 Props */
export interface FormTextareaNodeProps {
  label?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  style?: React.CSSProperties;
}

/** 下拉选择预期 Props */
export interface FormSelectNodeProps {
  label?: string;
  name: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  style?: React.CSSProperties;
}

/** 复选框预期 Props */
export interface FormCheckboxNodeProps {
  label?: string;
  name: string;
  required?: boolean;
  style?: React.CSSProperties;
}

/** 提交按钮预期 Props */
export interface FormSubmitNodeProps {
  text?: string;
  loading?: boolean;
  style?: React.CSSProperties;
}

/* ==================== 数据系列 Props ==================== */

/** 数据列表预期 Props */
export interface DataListNodeProps {
  /** 静态数据模式：直接提供 items */
  items?: Array<Record<string, unknown>>;
  /** API 模式：数据端点 */
  api?: string;
  method?: 'GET' | 'POST';
  pageSize?: number;
  /** 数据字段映射：{ 模板变量: 数据字段名 } */
  fieldMapping?: Record<string, string>;
  style?: React.CSSProperties;
}

/** 数据徽标预期 Props */
export interface DataBadgeNodeProps {
  count?: number;
  /** API 模式：数据端点 */
  api?: string;
  text?: string;
  maxCount?: number;
  style?: React.CSSProperties;
}

/* ==================== 事件系统 ==================== */

/** 事件动作类型 */
export type EventActionType =
  | 'toast'
  | 'navigate'
  | 'open-modal'
  | 'close-modal'
  | 'confirm'
  | 'set-variable'
  | 'call-api'
  | 'dispatch-event'
  | 'reload'
  | 'back'
  | 'scroll-to'
  | 'custom-code';

/** Toast 消息提示配置 */
export interface ToastActionConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

/** 页面导航配置 */
export interface NavigateActionConfig {
  url: string;
  target?: '_self' | '_blank';
  params?: Record<string, string>;
}

/** 弹窗开关配置 */
export interface ModalActionConfig {
  modalId: string;
  data?: Record<string, unknown>;
}

/** 确认对话框配置 */
export interface ConfirmActionConfig {
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: EventAction[];
  onCancel?: EventAction[];
}

/** 变量操作配置 */
export interface SetVariableActionConfig {
  key: string;
  value: unknown;
  scope?: 'local' | 'page' | 'global';
}

/** API 调用配置 */
export interface CallApiActionConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  onSuccess?: EventAction[];
  onError?: EventAction[];
  assignTo?: string;
}

/** 自定义事件派发配置 */
export interface DispatchEventActionConfig {
  eventName: string;
  detail?: Record<string, unknown>;
}

/** 滚动到元素配置 */
export interface ScrollToActionConfig {
  selector: string;
  behavior?: 'smooth' | 'auto';
}

/** 自定义代码配置 */
export interface CustomCodeActionConfig {
  code: string;
  contextVars?: string[];
}

/**
 * 事件动作
 *
 * JSON 可序列化的动作描述，type 决定动作类型，config 为对应配置。
 * 设计为纯 JSON 数据结构，不包含函数引用，可持久化到数据库。
 */
export interface EventAction {
  /** 动作唯一标识 */
  id: string;
  /** 动作类型 */
  type: EventActionType;
  /** 可读标签（编辑器显示用） */
  label?: string;
  /** 动作配置（类型不同，配置结构不同） */
  config: Record<string, unknown>;
}

/**
 * 事件绑定定义
 *
 * 描述一个 DOM 事件触发时执行的动作链。
 * 存储在 SchemaNode.events 数组中。
 */
export interface EventBinding {
  /** DOM 事件名：click | change | mouseenter | mouseleave | submit | focus | blur 等 */
  event: string;
  /** 动作列表（按顺序串行执行） */
  actions: EventAction[];
  /** 防抖延迟(ms) */
  debounce?: number;
  /** 节流延迟(ms) */
  throttle?: number;
  /** 条件表达式（运行时求值，返回 false 则跳过本次执行） */
  condition?: string;
}

/** 事件绑定类型守卫：判断是否为 toast 动作 */
export function isToastAction(action: EventAction): action is EventAction & { config: ToastActionConfig } {
  return action.type === 'toast';
}

/** 事件绑定类型守卫：判断是否为 navigate 动作 */
export function isNavigateAction(action: EventAction): action is EventAction & { config: NavigateActionConfig } {
  return action.type === 'navigate';
}

/** 事件绑定类型守卫：判断是否为 confirm 动作 */
export function isConfirmAction(action: EventAction): action is EventAction & { config: ConfirmActionConfig } {
  return action.type === 'confirm';
}

/** 事件绑定类型守卫：判断是否为 call-api 动作 */
export function isCallApiAction(action: EventAction): action is EventAction & { config: CallApiActionConfig } {
  return action.type === 'call-api';
}

/* ==================== 渲染引擎核心类型 ==================== */

/** 基础组件 Props —— 所有组件统一接收的 Props */
export interface BaseComponentProps {
  node: SchemaNode;
  children?: React.ReactNode;
}

/** 组件渲染器接口 —— 所有组件签名相同 */
export type ComponentRenderer = React.ComponentType<BaseComponentProps>;

/**
 * 中间件函数
 * @param node - 当前渲染的 SchemaNode
 * @param next - 调用下一个中间件，或最终渲染
 * @returns ReactNode | null（null 表示跳过渲染）
 */
export type Middleware = (
  node: SchemaNode,
  next: (node: SchemaNode) => React.ReactNode,
) => React.ReactNode;

/* ==================== 组件注册表 ==================== */

/**
 * 组件渲染器接口（旧版，兼容保留）
 * 每个组件类型需要实现的渲染函数
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type OldComponentRenderer<P = Record<string, unknown>> = React.ComponentType<
  P & { children?: React.ReactNode }
>;

/**
 * 组件注册表
 * 根据组件类型名查找对应的 React 渲染组件
 */
export interface ComponentRegistry {
  get(type: string): ComponentRenderer | undefined;
  register(type: string, component: ComponentRenderer): void;
}

/**
 * 默认组件注册表实现
 * 基于 Map 存储，支持构造函数注入初始组件
 */
export class DefaultComponentRegistry implements ComponentRegistry {
  private components = new Map<string, ComponentRenderer>();

  constructor(initial?: Record<string, ComponentRenderer>) {
    if (initial) {
      Object.entries(initial).forEach(([type, comp]) =>
        this.components.set(type, comp),
      );
    }
  }

  get(type: string): ComponentRenderer | undefined {
    return this.components.get(type);
  }

  register(type: string, component: ComponentRenderer): void {
    this.components.set(type, component);
  }
}

/* ==================== 工具函数 ==================== */

/** 生成唯一 ID */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** 创建默认的 SchemaNode */
export function createDefaultNode(
  type: string,
  overrides?: Partial<SchemaNode>,
): SchemaNode {
  return {
    id: generateNodeId(),
    type,
    props: {},
    children: [],
    ...overrides,
  };
}
