# 低代码平台 — 迭代路线图

> 版本: v1.0
> 日期: 2026-06-21
> 前置文档: [`low-code-platform-spec.md`](./low-code-platform-spec.md)（架构设计）、[`low-code-platform-progress.md`](./low-code-platform-progress.md)（进度跟踪）

---

## 概要

此文档记录 MVP 之后的所有迭代计划，按优先级和依赖关系排序。每次迭代完成后续更新此文档。

### 迭代速览

| 迭代 | 主题 | 预估工时 | 前置依赖 |
|------|------|---------|---------|
| **Iteration 1** | MVP 补齐 + 基础体验优化 | 3-5天 | 无（基于 MVP） |
| **Iteration 2** | 功能增强：表单 + 导航组件 | 3-5天 | Iteration 1 |
| **Iteration 3** | 模板系统：区块复用 + 页面克隆 | 3-4天 | Iteration 2 |
| **Iteration 4** | 编辑器体验：自动保存 + 版本 + 回收站 | 3-5天 | Iteration 1 |
| **Iteration 5** | 高级功能：统计分析 + 自定义组件 | 5-7天 | Iteration 3 |
| **Iteration 6** | 多语言 + 审批流程 | 5-7天 | Iteration 5 |

---

## Iteration 1：MVP 补齐 + 基础体验优化

**目标**：补齐 MVP 中遗漏的核心功能，提升编辑器基础使用体验。

### 1.1 图片上传（高优先级）

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 创建 PagesAssetsService | `pages/services/pages-assets.service.ts` | 图片上传业务逻辑，存至 `uploads/pages/` |
| 创建 upload 端点 | `pages/controllers/pages.controller.ts` | `POST /api/pages/upload`，multipart 接收文件 |
| 配置 multer（复用现有） | 复用 `common/filters/multer.config` | 限制文件类型 jpg/png/gif/webp/svg，大小 ≤5MB |
| 注册静态资源目录 | `main.ts` 或 `app.module.ts` | 确保 `/assets/uploads/pages/` 可访问 |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| Image 上传组件 | `PageEditor/ImageUpload.tsx` | GrapesJS Image 组件集成上传，支持本地上传 + 外链 |
| 注册自定义 Image 类型 | `PageEditor/blocks.ts` | 替换默认 image block，添加 upload 属性 |
| 图片选择弹窗 | `PageEditor/components/ImagePicker.tsx` | 上传进度条、URL 输入、预览 |

### 1.2 SEO 增强（中优先级）

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 添加 react-helmet-async 依赖 | `apps/web/package.json` | 新增依赖 |
| 包裹 HelmetProvider | `apps/web/src/App.tsx` | 在根组件添加 `<HelmetProvider>` |
| PageDetail 添加 Meta | `apps/web/src/pages/page/PageDetail.tsx` | Helmet 渲染 title/description/keywords/ogImage |
| 编辑器 SEO 面板 | `PageEditor/components/SEOPanel.tsx` | 编辑器侧栏新增 SEO 设置（title/desc/keywords/ogImage） |

### 1.3 技术债务清理

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 生成 pages 表迁移文件 | `apps/server/src/database/migrations/` | TypeORM migration generate |
| 搜索扩展 | `pages/services/pages.service.ts` | keyword 同时搜索 title + description |
| update 端点改为 PUT | `pages/controllers/pages.controller.ts` | 与 SPEC 设计对齐（幂等性） |
| Editor ESLint 配置 | `apps/editor/eslint.config.js` | 配置 ESLint 保证代码风格 |
| 分页 addTotalPages | `pages/services/pages.service.ts` | 接口返回 totalPages（当前已实现，确认） |

### 1.4 编辑器 UI 优化

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 页面加载骨架屏 | `PageEditor/index.tsx` | 使用 Skeleton 替代 Spin，减少视觉跳跃 |
| 编辑器离开确认 | `PageEditor/hooks/useUnsavedWarning.ts` | 未保存时离开页面弹窗确认 |
| 编辑器快捷键 | `PageEditor/hooks/useKeyboardShortcuts.ts` | Ctrl+S 保存、Ctrl+Shift+P 发布 |
| 页面列表批量操作 | `PageList/index.tsx` | 批量删除、批量归档 |

### 1.5 错误处理完善

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 编辑器崩溃边界 | `PageEditor/ErrorFallback.tsx` | Error Boundary 捕获 GrapesJS 异常，显示"重新加载" |
| 网络断线提示 | `services/http.ts` | 断网时显示提示条，恢复后自动重试 |
| 表单校验统一 | `PageList/index.tsx` | 创建页面时的 slug 重复友好提示 |
| 403/500 错误页面 | `App.tsx` | 非 401 错误显示友好提示页 |

---

## Iteration 2：功能增强——交互组件

**目标**：增加页面交互能力——表单收集用户数据、页面内导航。

### 2.1 表单组件

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 创建 PageForm 实体 | `pages/entities/page-form.entity.ts` | `page_form_submissions` 表：页面对应关系 + 字段配置 |
| 创建 FormSubmission 实体 | `pages/entities/form-submission.entity.ts` | 存储表单提交数据（JSON 格式） |
| 表单 Service | `pages/services/form.service.ts` | 提交/查询/导出 |
| 表单提交公开接口 | `pages/controllers/public-form.controller.ts` | `POST /api/public/pages/:slug/submit` |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| Form Block | `PageEditor/blocks.ts` | 表单容器组件 |
| Input / Textarea / Select / Checkbox | Blocks 子组件 | 常用表单字段 |
| 表单配置面板 | 属性配置 | 字段列表、标签、占位符、必填校验 |
| Submit Button | 按钮集成 | 提交动作绑定到表单 |
| 提交成功页面 | 自定义 | 成功提示或跳转 |

### 2.2 导航菜单组件

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| Nav Menu Block | `PageEditor/blocks.ts` | 锚点导航菜单 |
| 粘性导航组件 | 自定义 | 滚动时固定在顶部 |
| 滚动到目标区块 | JS 行为 | 导航链接关联页面内 Section ID |
| 嵌套菜单支持 | 可选 | 多级导航 |

### 2.3 编辑器体验增强 II

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 更多 Blocks | `PageEditor/blocks.ts` | 卡片、手风琴折叠、标签页、轮播图、地图 |
| 响应式预览增强 | `PageEditor/index.tsx` | iframe 内预览 + 设备模拟 |
| 右键菜单 | 自定义 | 复制/粘贴/删除/上移/下移 |

---

## Iteration 3：模板系统 + 页面克隆

**目标**：提高编辑效率，支持区块模板保存和页面复用。

### 3.1 区块模板

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 创建 BlockTemplate 实体 | `pages/entities/block-template.entity.ts` | 模板表：名称、分类、html/css/components |
| 模板 CRUD Service | `pages/services/template.service.ts` | 增删改查 |
| 模板 Controller | `pages/controllers/template.controller.ts` | `GET/POST/PUT/DELETE /api/page-templates` |
| 预置模板数据 | 种子数据 | 初始化 3-5 个常用模板（营销页头、产品展示、联系我们） |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 模板面板 | `PageEditor/TemplatePanel.tsx` | 侧栏新增"模板" tab，展示模板列表 |
| 保存为模板 | `PageEditor/hooks/useTemplate.ts` | 选中区块 → 保存为模板 |
| 从模板创建 | `PageList/TemplateSelect.tsx` | 新建页面时选择初始模板 |
| 模板预览 | `PageEditor/TemplatePreview.tsx` | 缩略图预览 |

### 3.2 页面克隆

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 克隆 API | `pages/controllers/pages.controller.ts` | `POST /api/pages/:id/clone` |
| 克隆 Service | `pages/services/pages.service.ts` | 复制页面数据，slug 自动添加 `-copy` 后缀 |
| 克隆按钮 | `PageList/index.tsx` | 操作列添加"克隆"按钮 |

---

## Iteration 4：编辑器体验——自动化 + 版本控制

**目标**：降低内容丢失风险，支持回滚操作。

### 4.1 自动保存

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 批量保存端点（可选） | `pages/controllers/pages.controller.ts` | `PATCH /api/pages/:id/auto-save`（轻量，不返回完整实体） |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| AutoSave Hook | `PageEditor/hooks/useAutoSave.ts` | 编辑后 30s 无操作自动保存 |
| 保存状态指示器 | `PageEditor/index.tsx` | 工具栏显示"已保存" / "保存中..." / "未保存的更改" |
| 差异保存优化 | 比较上次保存内容 | 无变更不触发 API 调用（减少无效请求） |

### 4.2 页面版本历史

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 创建 PageVersion 实体 | `pages/entities/page-version.entity.ts` | 版本表：pageId、versionNumber、html/css/components、snapshot |
| 版本 Service | `pages/services/version.service.ts` | 保存版本（每次 publish/update 时自动记录） |
| 版本 API | `pages/controllers/version.controller.ts` | `GET /api/pages/:id/versions`、`POST /api/pages/:id/versions/:v/restore` |
| 版本自动记录 | `pages/services/pages.service.ts` | 在 update/publish 时触发版本快照 |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 版本历史面板 | `PageEditor/VersionPanel.tsx` | 侧栏 tab 展示版本列表（时间线视图） |
| 版本对比 | 差异对比 | 选择两个版本对比 html 差异 |
| 版本回滚 | `PageEditor/hooks/useVersion.ts` | 恢复到选中版本（确认后加载历史数据） |

### 4.3 页面回收站

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 回收站查询 | `pages/services/pages.service.ts` | `findAll` 增加 `withDeleted` 参数，仅查询已删除 |
| 恢复 API | `pages/controllers/pages.controller.ts` | `POST /api/pages/:id/restore` |
| 彻底删除 API | `pages/controllers/pages.controller.ts` | `DELETE /api/pages/:id/hard`（仅管理员） |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 回收站页面 | `pages/TrashList/index.tsx` | 独立页面或弹窗，展示已删除页面 |
| 恢复操作 | `TrashList/index.tsx` | 点击恢复后回到页面列表 |
| 永久删除确认 | `TrashList/index.tsx` | 二次确认 + 危险操作提示 |

---

## Iteration 5：高级功能——数据分析 + 自定义组件

**目标**：深入编辑器扩展性，增加数据驱动的运营能力。

### 5.1 页面访问统计

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 创建 PV 记录实体 | `pages/entities/page-pv.entity.ts` | 简单计数或每日聚合 |
| PV 中间件 | `pages/middleware/page-pv.middleware.ts` | 公开接口访问时 +1 |
| 统计查询 API | `pages/controllers/stats.controller.ts` | `GET /api/pages/:id/stats` |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 统计数据面板 | `PageEditor/StatsPanel.tsx` | 页面列表新增"访问量"列 |
| 趋势图表 | `PageList/StatsChart.tsx` | 简单折线图展示日 PV |

### 5.2 自定义组件 / 组件市场

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 自定义组件注册 API | `pages/controllers/custom-component.controller.ts` | 上传/注册自定义 React 组件 |
| 组件存储 Schema | MySQL / 本地文件 | 组件源码 + 元信息 |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 自定义组件面板 | `PageEditor/CustomComponents.tsx` | 展示已注册的自定义组件 |
| 组件注册流程 | 管理员界面 | 上传组件 zip → 解析 → 注册到 GrapesJS |
| 组件预览 | GrapesJS component | 自定义组件在画布中渲染 |

### 5.3 部分组件增强

| 任务 | 说明 |
|------|------|
| 视频组件扩展 | 支持更多平台嵌入（Bilibili、腾讯视频） |
| 图片组件增强 | 懒加载、图片裁剪参数、Alt 文本、响应式图片 |
| 按钮组件增强 | 支持图标、Badge、Loading 状态 |
| 动态数据绑定 | 部分组件支持从 API 获取数据渲染（如最新文章列表） |

---

## Iteration 6：多语言 + 审批流程

**目标**：企业级功能，满足多语言内容管理和发布治理需求。

### 6.1 页面多语言

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 添加 locale 字段 | `pages/entities/page.entity.ts` | locale: string（zh-CN / en-US / ja-JP） |
| 关联翻译组 | `pages/entities/page-translation-group.entity.ts` | 同页面不同语言版本通过 groupId 关联 |
| 语言筛选 API | `pages/controllers/pages.controller.ts` | 按 locale 筛选 |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 语言切换器 | `PageEditor/LocaleSwitcher.tsx` | 编辑器顶部语言选择 |
| 翻译管理 | `PageEditor/TranslationPanel.tsx` | 同页面多语言版本同步编辑 |
| 同步翻译 | 自动匹配组件 | 不同语言间组件结构同步，仅文本差异 |

### 6.2 发布审批流程

**后端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 状态扩展 | `pages/entities/page.entity.ts` | status 增加 `reviewing` 状态 |
| 审批人配置 | 新增 Role/权限 | 确定谁可以审核 |
| 提交审核 API | `pages/controllers/pages.controller.ts` | `PATCH /api/pages/:id/submit-review` |
| 审核通过/驳回 API | `pages/controllers/pages.controller.ts` | `PATCH /api/pages/:id/approve` / `/reject` |
| 审核通知 | 系统通知 | 审核通过/驳回时通知创建者 |

**编辑器前端**

| 任务 | 涉及文件 | 说明 |
|------|---------|------|
| 审批状态展示 | `PageList/index.tsx` | 状态列增加"审核中" Tag |
| 提交审核操作 | `PageEditor/index.tsx` | 工具栏增加"提交审核"按钮 |
| 审核面板（管理员） | `pages/ReviewList/index.tsx` | 待审核列表 + 通过/驳回操作 |

---

## 附录 A：依赖升级计划

| 包 | 当前版本 | 升级目标 | 说明 |
|---|---------|---------|------|
| grapesjs | ^0.23.2 | 保持跟踪 | 0.23.x 稳定版，后续关注 0.24+ |
| @vitejs/plugin-react | ^5.2.0 | 保持跟踪 | Vite 8 对应 |
| antd | ^6.3.1 | 保持跟踪 | No breaking changes expected |

## 附录 B：未来可能方向（待调研）

- **AI 辅助生成页面**：通过 LLM Prompt 自动生成组件结构，加速搭建
- **页面快照 / 发布版本回滚**：已发布页面的版本回滚
- **外部数据源绑定**：组件数据从第三方 API 获取
- **团队协作**：多人同时编辑同一页面（Operational Transform / CRDT）
- **SSR / SSG 支持**：低代码页面 Next.js 风格预渲染提升 SEO
- **导出为静态 HTML**：一键导出完整 HTML 供独立部署
- **组件市场开放**：允许第三方开发者上传/发布组件
- **页面性能评分**：集成 Lighthouse 评分，提供优化建议
- **A/B 测试集成**：同一 URL 不同版本按流量比例分配
