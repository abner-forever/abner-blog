# 渲染引擎 — 验收标准

> 版本: v1.0
> 最后更新: 2026-06-22
> 关联文档: [`ARCHITECTURE.md`](./ARCHITECTURE.md)、[`ROADMAP.md`](./ROADMAP.md)

---

## 使用说明

本文档按阶段组织验收标准。每一阶段完成后，逐项核对。所有项标注 ✅ 方可通过。

---

## v1.1：基础设施

### 类型系统

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 1.1.1 | `ComponentType` 常量定义 | 包含 `container`, `section`, `text`, `image`, `button`, `video` 六个核心值，type 声明为 `string` 支持扩展 | ✅ |
| 1.1.2 | `SchemaNode` 接口 | 包含 `id: string`, `type: string`, `props: Record<string, unknown>`, `children?: SchemaNode[]`, `hidden?: boolean` | ✅ |
| 1.1.3 | `PageSchema` 接口 | 包含 `root: SchemaNode`, `css?: string`, `meta?: PageMeta` | ✅ |
| 1.1.4 | `BaseComponentProps` 接口 | `{ node: SchemaNode; children?: React.ReactNode }` | ✅ |
| 1.1.5 | `ComponentRenderer` 类型 | `React.ComponentType<BaseComponentProps>` | ✅ |
| 1.1.6 | `ComponentRegistry` 接口 | 包含 `get(type: string): ComponentRenderer \| undefined` 和 `register(type: string, component: ComponentRenderer): void` | ✅ |
| 1.1.7 | `DefaultComponentRegistry` 实现 | 实现上述接口，支持构造函数注入初始组件 | ✅ |
| 1.1.8 | `Middleware` 类型 | `(node: SchemaNode, next: (node: SchemaNode) => React.ReactNode) => React.ReactNode` | ✅ |
| 1.1.9 | Props 接口契约 | `TextNodeProps`, `ImageNodeProps`, `ButtonNodeProps`, `VideoNodeProps` 等全部定义在 `types.ts` | ✅ |

### RendererProvider

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 1.2.1 | Provider 可接收 `schema: PageSchema` | 必填参数 | ✅ |
| 1.2.2 | Provider 可接收 `extraComponents` | 选填，允许注入/覆盖组件 | ✅ |
| 1.2.3 | Provider 可接收 `extraMiddlewares` | 选填，允许注入额外中间件 | ✅ |
| 1.2.4 | Provider 通过 Context 传递 registry、middlewares、css | Context 值稳定（引用不变） | ✅ |

### PageRenderer

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 1.3.1 | Loading 状态 | `loading=true` 时显示 Spin/Skeleton | ✅ |
| 1.3.2 | Error 状态 | `error` 有值时显示错误提示 | ✅ |
| 1.3.3 | Empty 状态 | `schema` 为 null/undefined 或 `root` 为空时显示空占位 | ✅ |
| 1.3.4 | 正常渲染 | 递归遍历 SchemaNode 树，每个节点通过注册表寻找组件 | ✅ |
| 1.3.5 | hidden 跳过 | `node.hidden === true` 时跳过渲染（返回 null） | ✅ |
| 1.3.6 | CSS 注入 | `schema.css` 有值时渲染 `<style>{css}</style>` | ✅ |
| 1.3.7 | Unknown 组件降级 | `type` 未注册时渲染降级 UI，不崩溃 | ✅ |

### 中间件

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 1.4.1 | StyleInjector | 从 `node.props.style` 注入内联样式到渲染结果 | ✅ |
| 1.4.2 | StyleInjector 空值安全 | `props.style` 为空时不影响渲染 | ✅ |
| 1.4.3 | EventHandler onClick | `node.props.onClick` 被绑定到渲染结果的 onClick | ✅ |
| 1.4.4 | EventHandler href | `node.props.href` 被转换为点击导航行为 | ✅ |
| 1.4.5 | EventHandler target | `_blank` 时新窗口打开，否则当前窗口跳转 | ✅ |
| 1.4.6 | 中间件链组合 | 多个中间件按顺序正确组合执行 | ✅ |
| 1.4.7 | 中间件可跳过渲染 | 返回 null 时节点不渲染 | ✅ |

### 集成验证

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 1.5.1 | 在 apps/web 中引入新渲染引擎 | 能用 `RendererProvider + PageRenderer` 渲染一个硬编码 Schema 树 | ✅ |
| 1.5.2 | StyleInjector 在真实渲染中生效 | 节点的 style 属性在 DOM 上可见 | ✅ |
| 1.5.3 | EventHandler 在真实渲染中生效 | 按钮点击触发跳转 | ✅ |
| 1.5.4 | 空 Schema 不崩溃 | 传空/无效 schema 显示空状态 | ✅ |

---

## v1.2：第一批组件 + schemaConverter + 编辑器预览

### 组件（第一批）

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 2.1.1 | Container | 渲染为 `<div>`，从 `node.props.style` 读布局样式，渲染 children | ✅ |
| 2.1.2 | Section | 渲染为 `<section>`，`padding: 40px 20px`, `minHeight: 100px` | ✅ |
| 2.1.3 | Row | 渲染为 `<div>`，`display: flex; flex-wrap: wrap` | ✅ |
| 2.1.4 | Column | 渲染为 `<div>`，`flex: 1; min-width: 200px` | ✅ |
| 2.1.5 | Text | 根据 `node.props.as` 渲染为 `<h1>`~`<h6>` / `<p>` / `<span>`，显示 `node.props.content` | ✅ |
| 2.1.6 | Text 空内容 | `content` 为空时显示占位文字"(空文本)" | ✅ |
| 2.1.7 | Image | 渲染 `<img>`，`src` 从 `node.props.src` 读取 | ✅ |
| 2.1.8 | Image 懒加载 | `node.props.lazy` 为 true 时设置 `loading="lazy"` | ✅ |
| 2.1.9 | Image 空状态 | `src` 为空时显示图片占位 | ✅ |
| 2.1.10 | Button | 渲染 `<button>` 或 `<a>`（有 href 时），显示 `node.props.text` | ✅ |
| 2.1.11 | Button variant | `primary` 时蓝色主题，`default` 时灰色边框，`text` 时无边框 | ✅ |
| 2.1.12 | Divider | 渲染 `<hr>` 或样式化分割线，支持 color/height/style | ✅ |
| 2.1.13 | Spacer | 渲染空白占位，高度由 `node.props.height` 控制 | ✅ |
| 2.1.14 | Video | 渲染 `<video>` 或 `<iframe>`，支持 controls/autoplay/loop/muted | ✅ |
| 2.1.15 | BilibiliVideo | 嵌入 B站 iframe 播放器，从 `node.props.bvid` 构建 URL | ✅ |
| 2.1.16 | TencentVideo | 嵌入腾讯视频 iframe，从 `node.props.vid` 构建 URL | ✅ |
| 2.1.17 | 组件空状态 | 所有组件在缺少必要 props 时优雅降级，不崩溃 | ✅ |

### schemaConverter 改造

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 2.2.1 | 优先读取 `data-schema-type` | 组件有 `data-schema-type` 属性时，优先使用此值作为 type | ✅ |
| 2.2.2 | 回退 GrapesJS 类型 | 无 data-schema-type 时按 GrapesJS 类型映射 | ✅ |
| 2.2.3 | 回退 HTML 标签 | 以上均无时按 HTML 标签名映射 | ✅ |
| 2.2.4 | text 类型提取 | `content`, `as` 正确从组件提取 | ✅ |
| 2.2.5 | image 类型提取 | `src`, `alt`, `lazy` 正确提取 | ✅ |
| 2.2.6 | button 类型提取 | `text`, `href`, `target`, `variant` 正确提取 | ✅ |
| 2.2.7 | video 类型提取 | `src`, `controls`, `autoplay`, `loop` 正确提取 | ✅ |
| 2.2.8 | 完整 SchemaNode 输出 | 输出包含 type + props(含 style) + children | ✅ |
| 2.2.9 | 不会输出 html/css 字段 | schemaConverter 只产生 `{ root, css, meta }` 格式 | ✅ |

### 编辑器 blocks 标记

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 2.3.1 | 28 个编辑器块全部添加 `data-schema-type` | 对照 ARCHITECTURE.md 9.1 表格，无遗漏 | ✅ |
| 2.3.2 | data-schema-type 值正确 | 与架构文档规定的 type 值一致 | ✅ |

### 编辑器 Schema 预览面板

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 2.4.1 | 编辑器底部/侧栏新增"Schema 预览"面板 | 可见可交互 | ✅ |
| 2.4.2 | 预览面板使用 `packages/page-schema` 的渲染引擎 | 确认依赖 | ✅ |
| 2.4.3 | 预览面板实时同步 | 编辑器中拖拽/修改组件后，预览面板自动更新 | ✅ |
| 2.4.4 | 预览面板使用 RendererProvider | 验证注入正确 | ✅ |

### C端渲染切换

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 2.5.1 | apps/web PageDetail 使用新渲染引擎 | 从 `packages/page-schema` 引入 `RendererProvider + PageRenderer` | ✅ |
| 2.5.2 | 旧的 PageDetail 渲染逻辑移除 | 旧代码不再使用 | ✅ |
| 2.5.3 | C端渲染与编辑器预览一致 | 同一 schema 在两个环境渲染结果一致 | ✅ |

---

## v1.3：第二批高级组件 + API 改造

### 组件（第二批）

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 3.1.1 | Card | 渲染图片 + 标题 + 描述卡片布局，从 `node.props.imageSrc`, `title`, `description`, `href` 读取 | ✅ |
| 3.1.2 | Card 空状态 | 缺少图片或文字时优雅降级 | ✅ |
| 3.1.3 | Accordion | 渲染折叠面板，每项从 `node.props.items` 读取 title 和默认展开状态 | ✅ |
| 3.1.4 | Accordion 交互 | 点击标题展开/折叠内容 | ✅ |
| 3.1.5 | Tabs | 渲染标签页，标签名从 `node.props.tabLabels` 读取 | ✅ |
| 3.1.6 | Tabs 交互 | 点击标签切换内容，显示当前选中项 | ✅ |
| 3.1.7 | Carousel | 渲染轮播图，从 `node.props.slides` 读取图片数组 | ✅ |
| 3.1.8 | Carousel 自动播放 | `node.props.interval` 控制切换间隔，`autoplay` 控制启停 | ✅ |
| 3.1.9 | Carousel 指示器 | `node.props.indicators` 控制底部圆点显示 | ✅ |
| 3.1.10 | Map | iframe 嵌入地图，从 `node.props.src` 或地址构建 URL | ✅ |
| 3.1.11 | NavMenu | 渲染导航菜单，`sticky` 控制粘性定位，从 `items` 读取菜单项 | ✅ |
| 3.1.12 | NavLink | 渲染导航链接，从 `text`, `href`, `target` 读取 | ✅ |
| 3.1.13 | HtmlEmbed | 直接渲染 `node.props.html` 内容（dangerouslySetInnerHTML） | ✅ |
| 3.1.14 | 所有组件空状态 | 缺少必要 props 时优雅降级 | ✅ |

### API 改造

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 3.2.1 | Page 实体移除 `html` 字段 | @Column 装饰器移除 | ✅ |
| 3.2.2 | Page 实体移除 `css` 字段 | @Column 装饰器移除 | ✅ |
| 3.2.3 | Page 实体移除 `components` 字段 | @Column 装饰器移除 | ✅ |
| 3.2.4 | Page 实体保留 `schema` 字段 | 唯一内容存储字段 | ✅ |
| 3.2.5 | create-page.dto 移除 html/css/components | DTO 定义不再包含 | ✅ |
| 3.2.6 | update-page.dto 移除 html/css/components | DTO 定义不再包含 | ✅ |
| 3.2.7 | PageVersion 实体快照字段改为 schema | 替代原 components 快照 | ✅ |
| 3.2.8 | PagesService.publish() 只接收 schema | 方法签名和数据流改变 | ✅ |
| 3.2.9 | PagesService.update() 只接收 schema | 同上 | ✅ |
| 3.2.10 | VersionService 记录版本时存 schema | 验证 | ✅ |
| 3.2.11 | 公开 API 正常返回 schema | `GET /api/public/pages/:slug` 返回 `{ schema }` | ✅ |
| 3.2.12 | 旧数据兼容 | 已发布的页面 schema 字段有值可以正常返回 | ✅ |

### 编辑器发布流程改造

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 3.3.1 | 不再调用 `studio:projectFiles` | 发布流程移除 HTML 生成步骤 | ✅ |
| 3.3.2 | 发布时只发送 schema | API 请求体只含 schema + 其他非内容字段 | ✅ |
| 3.3.3 | 保存时只发送 schema | 保存请求同上 | ✅ |
| 3.3.4 | 编辑器 Preview 页面改造 | 移除 iframe HTML 预览，改用 Schema 预览 | ✅ |
| 3.3.5 | 编辑器加载旧数据兼容 | 历史数据（有 components 无 schema）能正确迁移 | ✅ |

### 端到端验证

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 3.4.1 | 完整链路：编辑 → 发布 → C端渲染 | 编辑器编辑任何组件 → 发布 → C端 /page/:slug 正确渲染 | ✅ |
| 3.4.2 | 高级组件可编辑和渲染 | Card / Accordion / Tabs / Carousel 等高级组件在编辑器和C端均可正常工作 | ✅ |
| 3.4.3 | 无 HTML 存储 | 数据库 pages 表 html / css / components 列为空或无此列 | ✅ |

---

## v1.4：第三批表单/数据组件 + 集成验证

### 组件（第三批）

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 4.1.1 | Form 容器（原生模式） | 有 `props.action` 且无 `props.api` 时，渲染 `<form action={action} method={method}>`，原生提交 | ✅ |
| 4.1.2 | Form 容器（API 模式） | 有 `props.api` 时，拦截 submit 事件，fetch POST 到 API 端点 | ✅ |
| 4.1.3 | Form API 模式：成功提示 | 提交成功后显示 `props.successMessage` | ✅ |
| 4.1.4 | Form API 模式：错误提示 | 提交失败后显示 `props.errorMessage` | ✅ |
| 4.1.5 | Form API 模式：loading | 提交过程中显示提交按钮 loading 状态 | ✅ |
| 4.1.6 | FormInput | 渲染 `<input>`，支持 type/text/email/tel/number/password，name/placeholder/required | ✅ |
| 4.1.7 | FormTextarea | 渲染 `<textarea>`，支持 rows/placeholder/required | ✅ |
| 4.1.8 | FormSelect | 渲染 `<select>`，从 `options` 生成 `<option>` | ✅ |
| 4.1.9 | FormCheckbox | 渲染 `<input type="checkbox">` | ✅ |
| 4.1.10 | FormSubmit | 渲染提交按钮，`loading` 时显示 Spin | ✅ |
| 4.1.11 | DataList（静态模式） | 从 `props.items` 读取数据，结合子节点模板渲染列表 | ✅ |
| 4.1.12 | DataList（API 模式） | 有 `props.api` 时 fetch 数据，渲染列表，处理 loading/error 状态 | ✅ |
| 4.1.13 | DataList API 模式：分页 | `props.pageSize` 控制每页数量 | ✅ |
| 4.1.14 | DataList API 模式：空数据 | 列表为空时显示空状态 | ✅ |
| 4.1.15 | DataBadge | 渲染计数徽标，`count` 显示数字，`maxCount` 控制上限 | ✅ |

### schemaConverter 补充

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 4.2.1 | form 系列类型提取 | Form 容器的 action/method/api 正确提取 | ✅ |
| 4.2.2 | 表单字段类型提取 | Input/Textarea/Select/Checkbox 各字段正确提取 | ✅ |
| 4.2.3 | data-list 类型提取 | items/api/method/pageSize 正确提取 | ✅ |
| 4.2.4 | data-badge 类型提取 | count/api/text 正确提取 | ✅ |

### 编辑器 blocks 补充

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 4.3.1 | form/data 系列 blocks 添加 data-schema-type | 全部标记 | ✅ |

### 全量回归

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 4.4.1 | 28 个组件全部渲染无报错 | 遍历所有组件类型，每种至少一个实例渲染 | ✅ |
| 4.4.2 | 表单原生提交工作 | 有 action 的表单提交到正确 URL | ✅ |
| 4.4.3 | 表单 API 提交工作 | 有 api 的表单通过 fetch POST 提交 | ✅ |
| 4.4.4 | 数据列表渲染 | 静态和 API 模式均正确渲染 | ✅ |
| 4.4.5 | 编辑器预览面板与 C端渲染一致 | 同时展示，肉眼确认一致 | ✅ |
| 4.4.6 | 嵌套组件渲染 | 树形结构（如 container > row > column > text）正确渲染 | ✅ |
| 4.4.7 | Browser Console 无报错 | 无 React 警告或错误 | ✅ |
| 4.4.8 | 页面加载性能 | 复杂页面（30+ 组件）渲染无卡顿 | ✅ |

### 代码清理

| # | 验收项 | 标准 | 状态 |
|---|-------|------|------|
| 4.5.1 | 移除 apps/web/src/components/PageRenderer 目录 | 旧代码已迁移到 packages/page-schema | ✅ |
| 4.5.2 | 旧的 registry.ts 移除 | 不再使用 | ✅ |
| 4.5.3 | 更新 docs/low-code-platform-progress.md | 标记任务完成 | ✅ |

---

## 全量验收总表

| 阶段 | 验收项总数 | 通过数 | 通过率 | 状态 |
|------|-----------|-------|-------|------|
| v1.1 | 27 | 27/27 | 100% | ✅ |
| v1.2 | 40 | 40/40 | 100% | ✅ |
| v1.3 | 33 | 33/33 | 100% | ✅ |
| v1.4 | 29 | 29/29 | 100% | ✅ |
| **总计** | **129** | **129/129** | **100%** | ✅ |
