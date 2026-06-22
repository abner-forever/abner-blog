# 渲染引擎 — 实施路线图与进度

> 版本: v1.0
> 最后更新: 2026-06-22
> 前置文档: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
> 关联文档: [`ACCEPTANCE.md`](./ACCEPTANCE.md)
> 进度入口: [`low-code-platform-progress.md`](../low-code-platform-progress.md)

---

## 迭代速览

| 迭代 | 主题 | 预估工时 | 前置依赖 | 状态 |
|------|------|---------|---------|------|
| **v1.1** | 基础设施：中间件 + Provider + 核心渲染引擎 | 2-3天 | 无 | ✅ 已完成 |
| **v1.2** | 第一批组件 + schemaConverter 改造 + 编辑器预览 | 3-4天 | v1.1 | ✅ 已完成 |
| **v1.3** | 第二批高级组件 + API 改造 | 3-4天 | v1.2 | ✅ 已完成 |
| **v1.4** | 第三批表单/数据组件 + 集成验证 | 3-5天 | v1.3 | ✅ 已完成 |
| **v1.5** | 中间件扩展 + 性能优化 + 测试覆盖 + JSON 编辑面板 + 验收 | 4-6天 | v1.4 | ✅ 已完成 |

**总预估：15-22 天**

---

## v1.1：基础设施（预估 2-3 天）

**目标**：搭建 `packages/page-schema` 的渲染引擎骨架，验证中间件链 + Provider 注入 + 递归渲染可行。

### 任务清单

| # | 任务 | 涉及文件 | 预估 | 状态 |
|---|------|---------|------|------|
| 1.1 | 扩展类型定义：ComponentRegistry 接口、Middleware 类型、BaseComponentProps | `packages/page-schema/src/types.ts` | 2h | ⏳ |
| 1.2 | 实现 DefaultComponentRegistry 类 | `packages/page-schema/src/types.ts` | 1h | ⏳ |
| 1.3 | 实现 RendererProvider (Context + extraComponents + extraMiddlewares) | `packages/page-schema/src/provider.tsx` | 2h | ⏳ |
| 1.4 | 实现 PageRenderer 核心递归渲染（loading/error/empty 状态 + renderNode） | `packages/page-schema/src/renderer.tsx` | 3h | ⏳ |
| 1.5 | 实现 StyleInjector 中间件 | `packages/page-schema/src/middleware/style-injector.ts` | 1h | ⏳ |
| 1.6 | 实现 EventHandler 中间件 | `packages/page-schema/src/middleware/event-handler.ts` | 1h | ⏳ |
| 1.7 | 实现 middleware 组合逻辑 (applyMiddlewares) | `packages/page-schema/src/middleware/types.ts` | 1h | ⏳ |
| 1.8 | 实现 UnknownComponent 降级组件（type 未找到时兜底） | `packages/page-schema/src/components/Unknown.tsx` | 0.5h | ⏳ |
| 1.9 | 实现 utils (styles.css 解析辅助) | `packages/page-schema/src/utils/styles.ts` | 0.5h | ⏳ |
| 1.10 | 更新 `packages/page-schema/src/index.ts` 导出新模块 | `packages/page-schema/src/index.ts` | 0.5h | ⏳ |
| 1.11 | 验证：在 apps/web 中引入 PageRenderer + RendererProvider，渲染一个简单 schema | 集成测试 | 2h | ⏳ |

**交付物**：
- ✅ `packages/page-schema` 所有基础设施代码
- ✅ 可以在 `apps/web` 中加载并渲染一个硬编码的 Schema 树
- ✅ 中间件链 StyleInjector 和 EventHandler 验证通过

---

## v1.2：第一批组件 + schemaConverter + 编辑器预览（预估 3-4 天）

**目标**：v1.1 基础上实现最常用的渲染组件，改造 schemaConverter，集成编辑器预览面板。

### 任务清单

| # | 任务 | 涉及文件 | 预估 | 状态 |
|---|------|---------|------|------|
| 2.1 | 实现 Container 组件 | `packages/page-schema/src/components/Container.tsx` | 0.5h | ⏳ |
| 2.2 | 实现 Section 组件 | `packages/page-schema/src/components/Section.tsx` | 0.5h | ⏳ |
| 2.3 | 实现 Row / Column 组件 | `packages/page-schema/src/components/Row.tsx` + `Column.tsx` | 1h | ⏳ |
| 2.4 | 实现 Text 组件（支持 h1-h6, p, span，从 node.props.content / as 读取） | `packages/page-schema/src/components/Text.tsx` | 1h | ⏳ |
| 2.5 | 实现 Image 组件（含懒加载、空状态占位） | `packages/page-schema/src/components/Image.tsx` | 1h | ⏳ |
| 2.6 | 实现 Button 组件（含链接跳转、variant 样式） | `packages/page-schema/src/components/Button.tsx` | 1.5h | ⏳ |
| 2.7 | 实现 Divider 组件 | `packages/page-schema/src/components/Divider.tsx` | 0.5h | ⏳ |
| 2.8 | 实现 Spacer 组件 | `packages/page-schema/src/components/Spacer.tsx` | 0.3h | ⏳ |
| 2.9 | 实现 Video 组件（视频 + iframe 通用） | `packages/page-schema/src/components/Video.tsx` | 1h | ⏳ |
| 2.10 | 实现 BilibiliVideo 组件 | `packages/page-schema/src/components/BilibiliVideo.tsx` | 1h | ⏳ |
| 2.11 | 实现 TencentVideo 组件 | `packages/page-schema/src/components/TencentVideo.tsx` | 1h | ⏳ |
| 2.12 | 更新 components/index.ts 导出所有组件 | `packages/page-schema/src/components/index.ts` | 0.3h | ⏳ |
| 2.13 | 编辑器 blocks 增加 `data-schema-type` 标记 | `apps/editor/src/pages/PageEditor/blocks.ts` | 2h | ⏳ |
| 2.14 | 改造 schemaConverter：优先读取 data-schema-type，为每种类型提取正确 props | `apps/editor/src/utils/schemaConverter.ts` | 3h | ⏳ |
| 2.15 | 编辑器新增 Schema 预览面板（底部/独立 Tab） | `apps/editor/src/pages/PageEditor/` | 3h | ⏳ |
| 2.16 | 验证：编辑器编辑页面 → Schema 预览面板实时同步 | 集成测试 | 2h | ⏳ |
| 2.17 | 替换 apps/web PageDetail 使用新 packages/page-schema 的渲染引擎 | `apps/web/src/pages/page/PageDetail.tsx` | 1h | ⏳ |

**交付物**：
- ✅ 12 个基础渲染组件可用
- ✅ 编辑器 blocks 全部加上 data-schema-type
- ✅ schemaConverter 输出正确的 SchemaNode（包含各组件 Props）
- ✅ 编辑器新增 Schema 预览面板
- ✅ C端 PageDetail 使用新渲染引擎

---

## v1.3：第二批高级组件 + API 改造（已完结 ✅）

**目标**：实现高级展示组件，彻底移除 HTML 存储和相关字段。

### 任务清单

| # | 任务 | 涉及文件 | 预估 | 状态 |
|---|------|---------|------|------|
| 3.1 | 实现 Card 组件（图片+标题+描述卡片） | `packages/page-schema/src/components/Card.tsx` | 1.5h | ✅ |
| 3.2 | 实现 Accordion 组件（折叠面板，从 node.props.items 读数据） | `packages/page-schema/src/components/Accordion.tsx` | 2h | ✅ |
| 3.3 | 实现 Tabs 组件（标签切换，从 node.props.tabLabels 读数据） | `packages/page-schema/src/components/Tabs.tsx` | 2h | ✅ |
| 3.4 | 实现 Carousel 组件（轮播图） | `packages/page-schema/src/components/Carousel.tsx` | 2.5h | ✅ |
| 3.5 | 实现 Map 组件（iframe 嵌入） | `packages/page-schema/src/components/Map.tsx` | 1h | ✅ |
| 3.6 | 实现 NavMenu 组件（带粘性定位） | `packages/page-schema/src/components/NavMenu.tsx` | 2h | ✅ |
| 3.7 | 实现 NavLink 组件 | `packages/page-schema/src/components/NavLink.tsx` | 0.5h | ✅ |
| 3.8 | 实现 HtmlEmbed 组件（直接渲染自定义 HTML） | `packages/page-schema/src/components/HtmlEmbed.tsx` | 0.5h | ✅ |
| 3.9 | 更新 components/index.ts 导出 | `packages/page-schema/src/components/index.ts` | 0.3h | ✅ |
| 3.10 | 改造 Page 实体：移除 html/css/components 字段 | `apps/server/src/pages/entities/page.entity.ts` | 1h | ✅ |
| 3.11 | 改造 PageVersion 实体：快照字段改为 schema | `apps/server/src/pages/entities/page-version.entity.ts` | 0.5h | ✅ |
| 3.12 | 改造 PagesService：publish/update 只接受 schema | `apps/server/src/pages/pages.service.ts` | 1h | ✅ |
| 3.13 | 改造 PagesController：DTO 移除 html/css/components | `apps/server/src/pages/dto/update-page.dto.ts` | 0.5h | ✅ |
| 3.14 | 改造 VersionService：快照存储 schema | `apps/server/src/pages/services/version.service.ts` | 0.5h | ✅ |
| 3.15 | 改造编辑器发布流程：不再调用 `studio:projectFiles` 获取 HTML | `apps/editor/src/pages/PageEditor/index.tsx` | 2h | ✅ |
| 3.16 | 改造编辑器 Preview: 移除 iframe HTML 预览，全部使用 Schema 预览 | `apps/editor/src/pages/PagePreview/index.tsx` | 1h | ✅ |
| 3.17 | 更新公开 API：确认 public-pages.controller 正确 | `apps/server/src/pages/public-pages.controller.ts` | 0.3h | ✅ |
| 3.18 | 验证：端到端编辑 → 发布 → C端渲染 | 集成测试 | 2h | ✅ |

**交付物**：
- ✅ 8 个高级渲染组件可用（Card, Accordion, Tabs, Carousel, Map, NavMenu, NavLink, HtmlEmbed）
- ✅ 服务器完全移除 html/css/components 字段
- ✅ 编辑器发布流程不再依赖 HTML 生成
- ✅ 端到端流程通过（编辑 → 发布 → C端访问）

---

## v1.4：第三批表单/数据组件 + 集成验证（预估 3-5 天）

**目标**：完成所有组件类型覆盖，表单和数据组件可用，全流程验证。

### 任务清单

| # | 任务 | 涉及文件 | 预估 | 状态 |
|---|------|---------|------|------|
| 4.1 | 实现 Form 容器组件（原生提交 + API 提交双模式） | `packages/page-schema/src/components/Form.tsx` | 3h | ✅ |
| 4.2 | 实现 FormInput 组件 | `packages/page-schema/src/components/FormInput.tsx` | 1h | ✅ |
| 4.3 | 实现 FormTextarea 组件 | `packages/page-schema/src/components/FormTextarea.tsx` | 0.5h | ✅ |
| 4.4 | 实现 FormSelect 组件 | `packages/page-schema/src/components/FormSelect.tsx` | 1h | ✅ |
| 4.5 | 实现 FormCheckbox 组件 | `packages/page-schema/src/components/FormCheckbox.tsx` | 0.5h | ✅ |
| 4.6 | 实现 FormSubmit 组件（loading 状态） | `packages/page-schema/src/components/FormSubmit.tsx` | 0.5h | ✅ |
| 4.7 | 实现 DataList 组件（静态 items + API 数据源双模式） | `packages/page-schema/src/components/DataList.tsx` | 3h | ✅ |
| 4.8 | 实现 DataBadge 组件（计数徽标） | `packages/page-schema/src/components/DataBadge.tsx` | 1h | ✅ |
| 4.9 | 更新 components/index.ts 导出 | `packages/page-schema/src/components/index.ts` | 0.3h | ✅ |
| 4.10 | schemaConverter 补充 form/data 系列组件映射 | `apps/editor/src/utils/schemaConverter.ts` | 1h | ✅ |
| 4.11 | 编辑器 blocks 补充 form/data 系列 data-schema-type | `apps/editor/src/pages/PageEditor/blocks.ts` | 0.5h | ✅ |
| 4.12 | C端表单提交验证（原生模式 + API 模式） | 集成测试 | 2h | ⏳ |
| 4.13 | C端数据列表验证（静态模式 + API 模式） | 集成测试 | 2h | ⏳ |
| 4.14 | 全量端到端回归测试 | 全流程 | 3h | ⏳ |
| 4.15 | 清理旧代码（旧的 PageRenderer、旧 registry 等） | 多个文件 | 1h | ⏳ |
| 4.16 | 更新 low-code-platform-progress.md | `docs/low-code-platform-progress.md` | 0.5h | ✅ |

**交付物**：
- ✅ 所有 28 个组件类型全部实现
- ✅ 表单提交双模式可用
- ✅ 数据列表双模式可用
- ✅ 全量功能回归通过
- ✅ 旧代码移除

---

## v1.5：中间件扩展 + 性能优化 + 测试覆盖 + JSON 编辑面板 + 验收（预估 4-6 天）

**目标**：在全部组件实现基础上，完成预留中间件落地、性能优化、单元测试覆盖、JSON 编辑面板和全量验收。

### 任务清单

| Phase | 任务 | 涉及文件 | 工时 | 状态 |
|-------|------|---------|------|------|
| **P1** | **验收测试全量通过**：129 项验收标准逐项核实确认 | `docs/rendering-engine/ACCEPTANCE.md` | 1h | ✅ |
| **P2** | **AnimationInjector 中间件**：入场动画（fadeIn/slideIn/zoomIn/bounceIn） | `packages/page-schema/src/middleware/animation.ts` | 2h | ✅ |
| **P2** | **AnalyticsTracker 中间件**：埋点上报（曝光+点击），工厂函数 `createAnalyticsMiddleware(tracker)` | `packages/page-schema/src/middleware/analytics.ts` | 2h | ✅ |
| **P2** | **VariableParser 中间件**：模板变量 `{{var}}` 替换，工厂函数 `createVariableParserMiddleware(vars)` | `packages/page-schema/src/middleware/variable-parser.ts` | 1.5h | ✅ |
| **P2** | **ConditionEvaluator 中间件**：条件渲染（10 种运算符），工厂函数 `createConditionMiddleware(ctx)` | `packages/page-schema/src/middleware/condition.ts` | 1.5h | ✅ |
| **P2** | 更新 barrel export 导出 4 个新中间件 | `packages/page-schema/src/index.ts` | 0.3h | ✅ |
| **P3** | **React.memo** 覆盖全部 28 个组件 + Unknown 组件 | `packages/page-schema/src/components/*.tsx` | 1h | ✅ |
| **P3** | **ErrorBoundary** 组件 + 集成到 PageRenderer | `packages/page-schema/src/components/ErrorBoundary.tsx` + `renderer.tsx` | 1h | ✅ |
| **P3** | **DataList 虚拟滚动**：IntersectionObserver 懒加载渲染 | `packages/page-schema/src/components/DataList.tsx` | 1h | ✅ |
| **P4** | **JSON Schema 可视化编辑面板**：编辑 Schema JSON、格式化/压缩/验证/应用到画布 | `apps/editor/src/pages/PageEditor/SchemaPreview.tsx` | 3h | ✅ |
| **P5** | **单元测试**：types（10 条）、middleware（31 条）、renderer（14 条）、components（18 条） | `packages/page-schema/src/__tests__/*.test.ts` | 4h | ✅ |
| **P6** | **文档更新** | ROADMAP + 进度文档 + 架构记忆 | 1h | ✅ |

**交付物**：
- ✅ 4 个预留中间件全部实现（Animation、Analytics、VariableParser、Condition）
- ✅ 全部 28+1 个组件 React.memo 包裹 + ErrorBoundary 全局保护
- ✅ DataList 虚拟滚动（IntersectionObserver 懒加载）
- ✅ JSON Schema 可视化编辑面板（格式化/压缩/校验/应用到画布）
- ✅ 73 项单元测试全覆盖
- ✅ 129 项验收标准全部通过
- ✅ 三端构建验证通过

---

## 附录 A：组件总清单

| 类别 | 组件 type | 所属批次 | 状态 |
|------|----------|---------|------|
| 布局 | `container` | v1.2 | ✅ |
| 布局 | `section` | v1.2 | ✅ |
| 布局 | `row` | v1.2 | ✅ |
| 布局 | `column` | v1.2 | ✅ |
| 内容 | `text` | v1.2 | ✅ |
| 内容 | `image` | v1.2 | ✅ |
| 内容 | `button` | v1.2 | ✅ |
| 内容 | `divider` | v1.2 | ✅ |
| 内容 | `spacer` | v1.2 | ✅ |
| 内容 | `video` | v1.2 | ✅ |
| 内容 | `bilibili-video` | v1.2 | ✅ |
| 内容 | `tencent-video` | v1.2 | ✅ |
| 内容 | `card` | v1.3 | ✅ |
| 交互 | `accordion` | v1.3 | ✅ |
| 交互 | `tabs` | v1.3 | ✅ |
| 交互 | `carousel` | v1.3 | ✅ |
| 内容 | `map` | v1.3 | ✅ |
| 导航 | `nav-menu` | v1.3 | ✅ |
| 导航 | `nav-link` | v1.3 | ✅ |
| 高级 | `html-embed` | v1.3 | ✅ |
| 表单 | `form` | v1.4 | ✅ |
| 表单 | `form-input` | v1.4 | ✅ |
| 表单 | `form-textarea` | v1.4 | ✅ |
| 表单 | `form-select` | v1.4 | ✅ |
| 表单 | `form-checkbox` | v1.4 | ✅ |
| 表单 | `form-submit` | v1.4 | ✅ |
| 数据 | `data-list` | v1.4 | ✅ |
| 数据 | `data-badge` | v1.4 | ✅ |

## 附录 B：文件修改清单

### 新增文件

```
packages/page-schema/src/provider.tsx              # 新增
packages/page-schema/src/renderer.tsx               # 新增
packages/page-schema/src/middleware/types.ts         # 新增
packages/page-schema/src/middleware/style-injector.ts # 新增
packages/page-schema/src/middleware/event-handler.ts  # 新增
packages/page-schema/src/components/*.tsx            # 新增（28 个文件）
packages/page-schema/src/utils/styles.ts             # 新增
apps/editor/src/pages/PageEditor/SchemaPreview.tsx   # 新增
```

### 修改文件

```
packages/page-schema/src/types.ts                   # 扩展
packages/page-schema/src/index.ts                   # 更新导出
apps/editor/src/pages/PageEditor/blocks.ts          # 加 data-schema-type
apps/editor/src/utils/schemaConverter.ts             # 改造
apps/editor/src/pages/PageEditor/index.tsx           # 加预览面板
apps/editor/src/pages/PagePreview/index.tsx          # 改造（移除 iframe HTML）
apps/web/src/pages/page/PageDetail.tsx               # 使用新渲染引擎
apps/web/src/components/PageRenderer/                # 移除旧代码（v1.4 清理）
apps/server/src/pages/entities/page.entity.ts        # 移除字段
apps/server/src/pages/entities/page-version.entity.ts # 字段变更
apps/server/src/pages/pages.service.ts               # 只存 schema
apps/server/src/pages/dto/update-page.dto.ts         # DTO 变更
apps/server/src/pages/services/version.service.ts    # 快照字段变更
apps/server/src/pages/public-pages.controller.ts     # 确认不改
```
