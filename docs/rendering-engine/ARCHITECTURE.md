# 渲染引擎 — 架构设计文档

> 版本: v1.0
> 最后更新: 2026-06-22
> 前置文档: [`low-code-platform-spec.md`](../low-code-platform-spec.md)
> 关联文档: [`ROADMAP.md`](./ROADMAP.md)、[`ACCEPTANCE.md`](./ACCEPTANCE.md)

---

## 目录

1. [设计目标](#1-设计目标)
2. [核心决策](#2-核心决策)
3. [架构总览](#3-架构总览)
4. [包结构](#4-包结构)
5. [类型系统](#5-类型系统)
6. [渲染引擎](#6-渲染引擎)
7. [组件契约](#7-组件契约)
8. [中间件系统](#8-中间件系统)
9. [编辑器集成](#9-编辑器集成)
10. [API 改造](#10-api-改造)
11. [数据流](#11-数据流)

---

## 1. 设计目标

### 1.1 核心理念

1. **Schema 为唯一源** — 彻底移除 HTML 字段，页面存储和渲染只依赖结构化 JSON Schema
2. **渲染引擎统一** — 编辑器预览和 C端渲染使用同一套渲染引擎，杜绝预览与线上不一致
3. **架构可扩展** — 渲染引擎引入中间件架构，横向关注点（样式、事件、动画、埋点）通过中间件链处理
4. **组件复用** — 所有渲染组件集中在 `packages/page-schema`，编辑器项目、C端项目共享

### 1.2 关键指标

| 指标 | 目标 |
|------|------|
| 组件类型覆盖 | 编辑器 25+ 组件类型全部映射到 Schema 类型 |
| 预览一致性 | 编辑器预览 = C端渲染 = 100% 一致 |
| 渲染引擎 | 独立的中间件架构，非 GrapesJS 绑定 |
| 包解耦 | `packages/page-schema` 包含类型 + 渲染引擎 + 所有组件 |

---

## 2. 核心决策

| # | 决策 | 结论 | 理由 |
|---|------|------|------|
| 1 | HTML 字段 | ❌ **移除**，保留 schema 唯一 | 单一数据源，避免不一致 |
| 2 | 组件类型系统 | **字符串扩展**（非严格枚举） | 类似 [removed] `nodeName` 设计，灵活扩展 |
| 3 | 组件渲染接口 | **Node-based** `{ node: SchemaNode; children? }` | 无中间 Props 映射层，存储即渲染 |
| 4 | 渲染架构 | **中间件链** v1 即引入 | 横向关注点统一处理，后续扩展不改架构 |
| 5 | v1 中间件 | StyleInjector + EventHandler | 最小必要集，其余预留 Hook |
| 6 | 注册方式 | **RendererProvider 注入** | 运行时可扩展，编辑器预览可注入 Mock |
| 7 | 组件 Props | **接口契约**先定义再实现 | schemaConverter 输出有据可依 |
| 8 | 表单 | **双模式**（原生提交 + API 提交） | 最小可用，高级可选 |
| 9 | 数据列表 | **双模式**（静态数据 + API 数据源） | 同上 |
| 10 | 编辑器块标记 | **加 `data-schema-type` 属性** | schemaConverter 无需猜测类型 |
| 11 | 编辑器预览 | GrapesJS 画布 + **新增 Schema 预览面板** | 不改编辑体验，确保预览一致 |
| 12 | 实施策略 | **分批迭代**（v1.1 → v1.4） | 每一步有可验证交付物 |

---

## 3. 架构总览

```
┌────────────────────────────────────────────────────────────┐
│                      编辑器 (apps/editor)                    │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │ GrapesJS 画布    │    │ Data Schema 预览面板          │   │
│  │ (拖拽编辑)       │    │ (PageRenderer 实时渲染)       │   │
│  └────────┬────────┘    └──────────────┬───────────────┘   │
│           │                             │                    │
│           ▼                             ▲                    │
│  ┌──────────────────────────────────────┴────┐              │
│  │ schemaConverter                          │              │
│  │ (GrapesJS 组件树 → SchemaNode)            │              │
│  └─────────────────────┬────────────────────┘              │
└────────────────────────┼───────────────────────────────────┘
                         │ 发布/保存
                         ▼
┌────────────────────────────────────────────────────────────┐
│            Server (apps/server) - pages 模块                │
│  ┌──────────────────────────────────────────────────┐      │
│  │ pages 表：schema TEXT (唯一内容字段)                │      │
│  │ html 字段：✗ 已移除                               │      │
│  │ css/components 字段：✗ 已移除                      │      │
│  └──────────────────────┬───────────────────────────┘      │
│                         │ GET /api/public/pages/:slug      │
└─────────────────────────┼──────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────────┐
│   packages/page-schema（渲染引擎 — 统一渲染）               │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │ Renderer │──▶│ Middleware    │──▶│ ComponentRegistry│   │
│  │ Provider  │   │ Chain        │   │ (注入式)         │   │
│  └──────────┘   │              │   └────────┬─────────┘   │
│                 │ StyleInjector│            │              │
│                 │ EventHandler │            ▼              │
│                 │ ...预留扩展   │   ┌──────────────────┐   │
│                 └──────────────┘   │ Component Tree   │   │
│                                     │ (Node-based)     │   │
│                                     │ text / image /   │   │
│                                     │ container / form  │   │
│                                     │ tabs / accordion  │   │
│                                     │ carousel / ...    │   │
│                                     └──────────────────┘   │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│              C端渲染 (apps/web)                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │ PageDetail (apps/web/src/pages/page/PageDetail)   │      │
│  │  ↓ RendererProvider + PageRenderer                │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

### 关键数据流

```
编辑器编辑 → schemaConverter → SchemaNode JSON → 服务器存储
                                                      ↓
C端访问 → API → SchemaNode JSON → RendererProvider
                                      → 中间件链
                                      → 递归渲染组件树
                                      → 最终 DOM
```

---

## 4. 包结构

### 4.1 `packages/page-schema/` 结构

```
packages/page-schema/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # 导出全部
│   │
│   ├── types.ts                    # 核心类型定义（已有 + 扩展）
│   │   ├── ComponentType (枚举基类)
│   │   ├── SchemaNode
│   │   ├── PageSchema
│   │   ├── ComponentRegistry
│   │   ├── ComponentRenderer (Node-based)
│   │   └── 组件 Props 接口契约
│   │       ├── TextNodeProps
│   │       ├── ImageNodeProps
│   │       ├── ButtonNodeProps
│   │       ├── VideoNodeProps
│   │       ├── FormNodeProps
│   │       ├── DataListNodeProps
│   │       └── ...
│   │
│   ├── provider.tsx                # RendererProvider (Context + extraComponents)
│   ├── renderer.tsx                # PageRenderer 核心递归渲染
│   │
│   ├── middleware/
│   │   ├── types.ts                # Middleware 接口定义
│   │   ├── style-injector.ts       # 样式注入中间件（v1）
│   │   └── event-handler.ts        # 事件处理中间件（v1）
│   │
│   ├── components/
│   │   ├── index.ts               # 导出所有内置组件
│   │   ├── Container.tsx
│   │   ├── Section.tsx
│   │   ├── Row.tsx
│   │   ├── Column.tsx
│   │   ├── Text.tsx
│   │   ├── Image.tsx
│   │   ├── Button.tsx
│   │   ├── Video.tsx
│   │   ├── Divider.tsx
│   │   ├── Spacer.tsx
│   │   ├── Card.tsx
│   │   ├── Accordion.tsx
│   │   ├── Tabs.tsx
│   │   ├── Carousel.tsx
│   │   ├── Map.tsx
│   │   ├── BilibiliVideo.tsx
│   │   ├── TencentVideo.tsx
│   │   ├── NavMenu.tsx
│   │   ├── NavLink.tsx
│   │   ├── HtmlEmbed.tsx
│   │   ├── Form.tsx
│   │   ├── FormInput.tsx
│   │   ├── FormTextarea.tsx
│   │   ├── FormSelect.tsx
│   │   ├── FormCheckbox.tsx
│   │   ├── FormSubmit.tsx
│   │   ├── DataList.tsx
│   │   └── DataBadge.tsx
│   │
│   └── utils/
│       ├── id.ts                   # generateNodeId 等工具（已有）
│       └── styles.ts              # CSS 解析/注入工具
```

### 4.2 依赖关系

```
apps/editor ──┬── packages/page-schema（渲染引擎预览）
              └── apps/server（API 交互）

apps/web ──┬── packages/page-schema（C端渲染）
           └── apps/server（public API）
```

---

## 5. 类型系统

### 5.1 ComponentType 设计

核心枚举覆盖渲染行为族，扩展通过字符串：

```typescript
/** 核心组件类型（枚举）
 *  覆盖主要渲染行为分组，扩展类型直接用字符串 */
export const ComponentType = {
  CONTAINER: 'container',
  SECTION: 'section',
  TEXT: 'text',
  IMAGE: 'image',
  BUTTON: 'button',
  VIDEO: 'video',
} as const;

export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

// 注意：扩展类型不加入枚举，渲染时 type 是 string
// 'card', 'accordion', 'tabs', 'carousel', 'form', 'data-list' 等直接作为字符串注册
```

### 5.2 SchemaNode（扩展后）

```typescript
export interface SchemaNode {
  /** 节点唯一标识 */
  id: string;
  /** 组件类型（字符串，支持枚举值 + 扩展值） */
  type: string;
  /** 组件属性（含 style + 各组件特有属性）
   *  节点渲染器从 props 中读取自有数据 */
  props: Record<string, unknown>;
  /** 子节点列表 */
  children?: SchemaNode[];
  /** 组件类型的 Schema 描述（编辑器属性面板用） */
  componentSchema?: ComponentSchema;
  /** 是否隐藏 */
  hidden?: boolean;
}
```

### 5.3 组件接口契约

每个组件类型在 `types.ts` 中定义 Props 接口，作为 schemaConverter 输出和组件读取的契约：

```typescript
/* ==================== 组件 Props 接口契约 ==================== */

/** 文本组件预期 Props */
export interface TextNodeProps {
  content?: string;
  /** 渲染标签：h1-h6 | p | span */
  as?: string;
}

/** 图片组件预期 Props */
export interface ImageNodeProps {
  src?: string;
  alt?: string;
  lazy?: boolean;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
}

/** 按钮组件预期 Props */
export interface ButtonNodeProps {
  text?: string;
  href?: string;
  target?: '_blank' | '_self';
  variant?: 'primary' | 'default' | 'text' | 'link';
  icon?: string;
  loading?: boolean;
}

/** 视频组件预期 Props */
export interface VideoNodeProps {
  src?: string;
  poster?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
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
}

/** 手风琴组件预期 Props */
export interface AccordionNodeProps {
  /** 每个面板的配置 */
  items?: Array<{
    title: string;
    defaultOpen?: boolean;
  }>;
}

/** 标签页组件预期 Props */
export interface TabsNodeProps {
  /** 每个标签页标签 */
  tabLabels?: string[];
  activeIndex?: number;
}

/** 轮播图组件预期 Props */
export interface CarouselNodeProps {
  interval?: number;
  autoplay?: boolean;
  indicators?: boolean;
  /** 每个幻灯片的图片 URL */
  slides?: string[];
}

/** 地图组件预期 Props */
export interface MapNodeProps {
  src?: string;
  address?: string;
  zoom?: number;
  width?: string;
  height?: string;
}

/** B站视频组件预期 Props */
export interface BilibiliVideoNodeProps {
  bvid?: string;
  aid?: number;
  page?: number;
  width?: string;
  height?: string;
}

/** 腾讯视频组件预期 Props */
export interface TencentVideoNodeProps {
  vid?: string;
  width?: string;
  height?: string;
}

/** 导航菜单组件预期 Props */
export interface NavMenuNodeProps {
  sticky?: boolean;
  items?: Array<{
    label: string;
    href: string;
    target?: '_blank' | '_self';
  }>;
}

/** 导航链接组件预期 Props */
export interface NavLinkNodeProps {
  text?: string;
  href?: string;
  target?: '_blank' | '_self';
}

/** 自定义 HTML 组件预期 Props */
export interface HtmlEmbedNodeProps {
  html?: string;
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
}

/** 输入框预期 Props */
export interface FormInputNodeProps {
  label?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
}

/** 多行文本预期 Props */
export interface FormTextareaNodeProps {
  label?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

/** 下拉选择预期 Props */
export interface FormSelectNodeProps {
  label?: string;
  name: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
}

/** 复选框预期 Props */
export interface FormCheckboxNodeProps {
  label?: string;
  name: string;
  required?: boolean;
}

/** 提交按钮预期 Props */
export interface FormSubmitNodeProps {
  text?: string;
  loading?: boolean;
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
}

/** 数据徽标预期 Props */
export interface DataBadgeNodeProps {
  count?: number;
  /** API 模式：数据端点 */
  api?: string;
  text?: string;
  maxCount?: number;
}
```

### 5.4 组件渲染器类型

```typescript
/** 基础组件 Props —— 所有组件统一接收的 Props */
export interface BaseComponentProps {
  node: SchemaNode;
  children?: React.ReactNode;
}

/** 组件渲染器接口
 *  所有组件均签名相同，从 node.props 中读取自有属性 */
export type ComponentRenderer = React.ComponentType<BaseComponentProps>;
```

### 5.5 组件注册表 (扩展后)

```typescript
export interface ComponentRegistry {
  get(type: string): ComponentRenderer | undefined;
  register(type: string, component: ComponentRenderer): void;
}

export class DefaultComponentRegistry implements ComponentRegistry {
  private components = new Map<string, ComponentRenderer>();

  constructor(initial?: Record<string, ComponentRenderer>) {
    if (initial) {
      Object.entries(initial).forEach(([type, comp]) => this.components.set(type, comp));
    }
  }

  get(type: string): ComponentRenderer | undefined {
    return this.components.get(type);
  }

  register(type: string, component: ComponentRenderer): void {
    this.components.set(type, component);
  }
}
```

---

## 6. 渲染引擎

### 6.1 RendererProvider

```typescript
interface RendererContextValue {
  registry: ComponentRegistry;
  middlewares: Middleware[];
  /** 全局 CSS */
  css?: string;
}

interface RendererProviderProps {
  schema: PageSchema;
  /** 额外的组件注册（可选，运行时注入覆盖内置组件） */
  extraComponents?: Record<string, ComponentRenderer>;
  /** 额外的中间件（可选） */
  extraMiddlewares?: Middleware[];
  children: React.ReactNode;
}
```

### 6.2 PageRenderer

```
PageRenderer
  ├── 初始渲染
  │   ├── Loading 状态 → Spin/Skeleton
  │   ├── Error 状态 → 错误提示
  │   └── Empty 状态 → 空提示
  │
  └── 正常渲染
      ├── 注入全局 <style>{css}</style>
      └── renderNode(root)
          └── 遍历节点树
              ├── hidden = true → 跳过
              ├── 中间件链处理
              │   ├── StyleInjector → 注入 node.props.style
              │   └── EventHandler → 绑定 onClick/href 等
              ├── registry.get(type) → 找到渲染组件
              │   ├── 找到 → 组件(node, children)
              │   └── 未找到 → Unknown 组件（降级为 div 显示警告）
              └── 递归 renderNode(children)
```

### 6.3 渲染核心伪代码

```typescript
function PageRenderer({ schema, loading, error }: PageRendererProps) {
  const { registry, middlewares, css } = useRendererContext();

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!schema?.root) return <Empty />;

  return (
    <>
      {css && <style>{css}</style>}
      <RenderNode node={schema.root} depth={0} />
    </>
  );
}

function RenderNode({ node, depth }: { node: SchemaNode; depth: number }) {
  const { registry, middlewares } = useRendererContext();

  if (node.hidden) return null;

  // 中间件链
  const processed = applyMiddlewares(node, middlewares);
  if (processed === null) return null; // 中间件跳过渲染

  // 子节点递归渲染
  const children = node.children?.map(child => (
    <RenderNode key={child.id} node={child} depth={depth + 1} />
  ));

  // 查找组件
  const Component = registry.get(node.type);
  if (!Component) {
    return <UnknownComponent node={node} children={children} />;
  }

  return <Component node={processed} children={children} />;
}
```

---

## 7. 组件契约

### 7.1 组件实现规范

每个渲染组件必须：

1. **签名为** `({ node, children }: BaseComponentProps) => ReactElement`
2. **从 `node.props` 读取**自有属性
3. **渲染 `children`** 作为子节点槽位
4. **处理空状态/缺省值** 显式展示占位或优雅降级
5. **不直接操作 DOM**（通过 props 传递回调给中间件）

### 7.2 组件 Props 与 Style 分离

```typescript
// 通用模式：props 分为 数据属性 + 样式属性
function Text({ node, children }: BaseComponentProps) {
  const { content, as = 'p' } = node.props as TextNodeProps;
  const style = node.props.style as React.CSSProperties | undefined;

  // style 由 StyleInjector 中间件处理，组件内部不直接处理 style
  // 但如果需要自定义样式合并，从 node.props.style 读取

  const Tag = as;
  return <Tag>{content || children || '(空文本)'}</Tag>;
}
```

---

## 8. 中间件系统

### 8.1 接口定义

```typescript
/**
 * 中间件函数
 * @param node - 当前渲染的 SchemaNode
 * @param next - 调用下一个中间件，或最终渲染
 * @returns ReactNode | null（null 表示跳过渲染）
 */
export type Middleware = (
  node: SchemaNode,
  next: (node: SchemaNode) => React.ReactNode
) => React.ReactNode;
```

### 8.2 StyleInjector（v1）

```typescript
/**
 * StyleInjector 中间件
 * - 读取 node.props.style → 转为内联样式
 * - 读取 node.props.className → 追加
 * - 通过 cloneElement 注入到渲染结果
 */
const styleInjector: Middleware = (node, next) => {
  const result = next(node);
  if (!React.isValidElement(result)) return result;

  const style = node.props.style as React.CSSProperties | undefined;
  const className = node.props.className as string | undefined;

  return React.cloneElement(result, {
    style: { ...style, ...result.props.style },
    className: [className, result.props.className].filter(Boolean).join(' ') || undefined,
  });
};
```

### 8.3 EventHandler（v1）

```typescript
/**
 * EventHandler 中间件
 * - 处理 node.props.onClick → 绑定 onClick
 * - 处理 node.props.href → 绑定导航事件
 * - 处理 node.props.onChange → 绑定 onChange（表单字段）
 */
const eventHandler: Middleware = (node, next) => {
  const result = next(node);
  if (!React.isValidElement(result)) return result;

  const onClick = node.props.onClick as Function | undefined;
  const href = node.props.href as string | undefined;
  const target = node.props.target as string | undefined;

  const extraProps: Record<string, unknown> = {};

  if (onClick) {
    extraProps.onClick = (e: React.MouseEvent) => onClick(e);
  }

  if (href) {
    extraProps.onClick = (e: React.MouseEvent) => {
      e.preventDefault();
      if (target === '_blank') {
        window.open(href, '_blank');
      } else {
        window.location.href = href;
      }
    };
  }

  return React.cloneElement(result, extraProps);
};
```

### 8.4 中间件组合

```typescript
function applyMiddlewares(node: SchemaNode, middlewares: Middleware[]): React.ReactNode {
  // 内置一个 identity 作为最终渲染
  const identity = (n: SchemaNode) => null; // 占位，实际由组件渲染

  // 从右到左组合中间件
  const chain = middlewares.reduceRight(
    (next, middleware) => (n: SchemaNode) => middleware(n, next),
    identity
  );

  return chain(node);
}
```

### 8.5 预留扩展点

以下中间件接口已预留，v1 不实现：

- `AnimationMiddleware` — 入场动画
- `AnalyticsMiddleware` — 埋点/统计
- `VariableParserMiddleware` — 变量绑定
- `ConditionMiddleware` — 条件渲染

---

## 9. 编辑器集成

### 9.1 编辑器块标记

每个 GrapesJS 块的 content HTML 中增加 `data-schema-type` 属性：

```typescript
// apps/editor/src/pages/PageEditor/blocks.ts
{
  id: 'carousel',
  label: '轮播图',
  content: `<div data-schema-type="carousel" data-interval="3000">
    <div class="slide"><img src="https://via.placeholder.com/800x400?text=Slide+1" alt="slide 1"/></div>
    <div class="slide"><img src="https://via.placeholder.com/800x400?text=Slide+2" alt="slide 2"/></div>
  </div>`,
}
```

`data-schema-type` 取值对照表：

| 编辑器块 | `data-schema-type` |
|---------|-------------------|
| 标题/文本 | `text` |
| 图片 | `image` |
| 按钮 | `button` |
| 分割线 | `divider` |
| 间距 | `spacer` |
| 视频 | `video` |
| B站视频 | `bilibili-video` |
| 腾讯视频 | `tencent-video` |
| 卡片 | `card` |
| 手风琴 | `accordion` |
| 标签页 | `tabs` |
| 轮播图 | `carousel` |
| 地图 | `map` |
| 容器 | `container` |
| 行 | `row` |
| 列 | `column` |
| 区块 | `section` |
| 表单容器 | `form` |
| 输入框 | `form-input` |
| 多行文本 | `form-textarea` |
| 下拉选择 | `form-select` |
| 复选框 | `form-checkbox` |
| 提交按钮 | `form-submit` |
| 导航菜单 | `nav-menu` |
| 导航链接 | `nav-link` |
| 数据列表 | `data-list` |
| 数据徽标 | `data-badge` |
| 自定义 HTML | `html-embed` |

### 9.2 schemaConverter 改造

当前按 HTML 标签映射 → 改为优先读取 `data-schema-type`：

```typescript
function detectNodeType(component: GrapesJSComponent): string {
  // 1. 优先读取 data-schema-type
  const schemaType = component.attributes?.['data-schema-type'];
  if (schemaType) return schemaType;

  // 2. 其次通过 GrapesJS 类型映射
  const gjType = component.type;
  if (GRAPESJS_TYPE_MAP[gjType]) return GRAPESJS_TYPE_MAP[gjType];

  // 3. 最后按 HTML 标签映射
  const tag = component.tagName;
  return TAG_TYPE_MAP[tag] || 'container';
}
```

同时，schemaConverter 需要为每种组件类型提取正确的 Props：

```typescript
function extractComponentProps(component: GrapesJSComponent, type: string): Record<string, unknown> {
  const baseProps = extractBaseProps(component); // id, style, className 等

  switch (type) {
    case 'text':
      return { ...baseProps, content: component.textContent, as: detectHeaderLevel(component) };
    case 'image':
      return { ...baseProps, src: component.attributes?.src, alt: component.attributes?.alt };
    case 'button':
      return { ...baseProps, text: component.textContent, href: component.attributes?.href };
    case 'carousel':
      return { ...baseProps, interval: Number(component.attributes?.['data-interval'] || '3000'), ... };
    case 'tabs':
      return { ...baseProps, tabLabels: extractTabLabels(component) };
    case 'form':
      return { ...baseProps, action: component.attributes?.action, method: component.attributes?.method };
    // ... 每个类型对应
    default:
      return baseProps;
  }
}
```

### 9.3 编辑器 Schema 预览面板

在编辑器 GrapesJS 画布之外新增预览面板：

```
+------------------------------------------------------+
| 编辑器布局                                             |
| +----------+  +------------------+  +--------------+ |
| | 组件面板   |  | GrapesJS 画布    |  | 属性面板      | |
| | (左侧)    |  | (拖拽编辑)       |  | (右侧)       | |
| +----------+  +------------------+  +--------------+ |
|                +------------------+                   |
|                | Schema 预览面板    | ← 新增           |
|                | (PageRenderer)    |                   |
|                | (底部/独立 Tab)    |                   |
|                +------------------+                   |
+------------------------------------------------------+
```

预览面板的数据流：
```
编辑器内容变化 → editor.getProjectData()
  → schemaConverter(projectData)
  → PageRenderer + RendererProvider
  → 实时预览
```

---

## 10. API 改造

### 10.1 实体变更

```typescript
// apps/server/src/pages/entities/page.entity.ts（改造后）

@Entity('pages')
export class Page {
  // ... 基础字段保持不变（id, title, slug, status 等）

  @Column({ type: 'longtext', nullable: true })
  schema: string;         // ★ 唯一内容字段（原 html/css/components 移除）

  // 以下字段移除：
  // @Column({ type: 'longtext', nullable: true }) html: string;        ✗ 移除
  // @Column({ type: 'longtext', nullable: true }) css: string;         ✗ 移除
  // @Column({ type: 'longtext', nullable: true }) components: string;  ✗ 移除

  // ... 其他字段不变（cover, locale, reviewStatus 等）
}
```

### 10.2 Service 变更

```typescript
// 发布/更新时，只存储 schema
async publish(id: string, dto: { schema: string; /* ...其他非内容字段 */ }) {
  // html / css / components 不再接收和存储
  const page = await this.pageRepo.findOne({ where: { id } });
  page.schema = dto.schema;
  // ...
}
```

### 10.3 版本快照变更

`PageVersion` 实体的快照字段从 `components` 改为 `schema`：

```typescript
// 版本快照只存储 schema
pageVersion.schema = page.schema; // 原 pageVersion.components = page.components
```

### 10.4 公开 API 变更

不变（本来就不返回 HTML/Components）：

```typescript
// GET /api/public/pages/:slug
{
  title, description, keywords, ogImage,
  schema: JSON.parse(page.schema)  // 不变
}
```

---

## 11. 数据流

### 11.1 编辑 → 发布 → 存储

```
用户拖拽编辑
   ↓
GrapesJS 内部状态 (editor.getProjectData())
   ↓
点击发布
   ↓
schemaConverter(editor) → { root, css, meta }
   ↓
POST /api/pages/:id (body: { schema: JSON.stringify(root + css + meta) })
   ↓
服务器存储到 pages.schema 字段
```

### 11.2 访问 → 加载 → 渲染

```
用户访问 /page/:slug
   ↓
GET /api/public/pages/:slug
   ↓
服务端返回 { schema: PageSchema }
   ↓
<RendererProvider schema={schema}>
  <PageRenderer />
</RendererProvider>
   ↓
中间件链处理 root → 递归渲染组件树 → DOM
```

### 11.3 编辑器实时预览

```
编辑器内容变化
   ↓
schemaConverter(editor) → PageSchema
   ↓
<RendererProvider schema={liveSchema}>
  <PageRenderer />
</RendererProvider>
   ↓
嵌入在编辑器底部的 Schema 预览面板
```
