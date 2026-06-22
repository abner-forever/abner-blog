# 低代码平台 — 开发进度

> 最后更新: 2026-06-22（v1.5 渲染引擎完成）
> 项目周期: 持续迭代开发

---

## 当前里程碑：Iteration 6 ✅ 已完成

MVP + Iteration 1~5 + Iteration 6（多语言支持 + 审批流程）已全部完成。

### 已完成功能

| 模块 | 功能 | 状态 | 说明 |
|------|------|------|------|
| **后端** | Page 实体 (含软删除) | ✅ | `pages` 表，含 html/css/components 三字段存储 |
| | CRUD Service + Controller | ✅ | 含 slug 唯一性校验、分页、状态筛选 |
| | 公开接口 | ✅ | `GET /api/public/pages/:slug` 无需认证 |
| | SSO 双认证 | ✅ | 复用 `sso-session` + `admin-jwt` 双 Guard |
| | SSO 回调编辑 | ✅ | `authorize` 支持 `redirectTo` 参数 |
| | **图片上传** | ✅ | `POST /api/pages/upload` → `uploads/assets/image/pages/` |
| | **搜索扩展** | ✅ | keyword 同时搜索 title + description |
| | **update 端点** | ✅ | `@Patch` → `@Put` 对齐 SPEC |
| | **表单提交 API** | ✅ | **NEW: FormSubmission 实体 + `POST /api/public/pages/:slug/submit` + 管理查询/CSV 导出** |
| **编辑器** | 项目初始化 | ✅ | Vite 6 + React 18 + Antd 6 + LESS + Redux |
| | SSO 登录页 | ✅ | 跳转 Keycloak 认证 |
| | 页面列表 | ✅ | Table + 搜索 + 状态筛选 + 创建弹窗 |
| | GrapesJS 编辑器 | ✅ | 自定义工具栏 + 设备切换 + 撤销/重做 |
| | Blocks 配置 | ✅ | **扩展至 31 个组件** (内容/布局/表单/导航/高级/动态数据) + 6 类样式管理 |
| | 保存/发布 | ✅ | 手动保存草稿 + Modal.confirm 发布 |
| | **图片上传集成** | ✅ | Asset Manager uploadFile 回调 → 自动上传 |
| | **SEO 设置弹窗** | ✅ | 工具栏 SEO 按钮 → 编辑 title/desc/keywords/ogImage |
| | **键盘快捷键** | ✅ | Ctrl+S 保存 / Ctrl+Shift+P 发布 |
| | **未保存提示** | ✅ | 导航拦截 + beforeunload 警告 + 脏状态指示灯 |
| | **加载骨架屏** | ✅ | Skeleton 替代简单 Spin |
| | **ESLint 配置** | ✅ | 添加 eslint.config.js + lint 脚本 |
| | **表单组件** | ✅ | **NEW: 表单容器 + 输入框/多行文本/下拉/复选框/提交按钮** |
| | **导航菜单** | ✅ | **NEW: 导航菜单(粘性/锚点) + 导航链接** |
| | **更多 Blocks** | ✅ | **NEW: 卡片、手风琴、标签页、轮播图、地图** |
| **C端渲染** | PageDetail 组件 | ✅ | `/page/:slug` 路由渲染 |
| | 全屏独立模式 | ✅ | 无导航/页脚、无宽度限制 |
| | 并发请求防护 | ✅ | fetchIdRef 防止乱序 |
| | **Helmet SEO** | ✅ | react-helmet-async → title/description/keywords/ogImage |
| | **表单提交处理** | ✅ | **NEW: 表单提交 (fetch POST) + 成功提示替换** |
| | **交互式 Block 行为** | ✅ | **NEW: 标签页切换/轮播图自动播放+指示点/锚点平滑滚动** |
| **模板系统** | **BlockTemplate 实体 + CRUD** | ✅ | **NEW: block_templates 表，含 components/分类/排序** |
| | **预置模板种子数据** | ✅ | **NEW: 4 个预置模板（营销落地页/关于我们/联系我们/产品展示）** |
| | **模板 API** | ✅ | **NEW: GET/POST/PUT/DELETE /api/page-templates** |
| | **编辑器连接服务器模板** | ✅ | **NEW: templates.onLoad 从 API 获取，fallback 空白页** |
| | **保存为模板** | ✅ | **NEW: 工具栏"保存为模板"按钮 + 弹窗（名称/分类/描述）** |
| **页面克隆** | **克隆 API** | ✅ | **NEW: POST /api/pages/:id/clone → slug 自动加 -copy 后缀** |
| | **克隆按钮** | ✅ | **NEW: 页面列表操作列"克隆"按钮** |
| **版本历史** | **PageVersion 实体** | ✅ | **NEW: page_versions 表，含 pageId/versionNumber/components/status** |
| | **版本 Service + Controller** | ✅ | **NEW: 版本记录/列表/恢复 API + 自动记录（update/publish 时触发）** |
| | **版本历史面板** | ✅ | **NEW: 编辑器工具栏"版本历史"按钮 + 时间线视图 + 回滚确认** |
| **自动保存** | **30s 防抖自动保存** | ✅ | **NEW: 监听 component:update/add/remove 事件 → 30s 防抖 → editor.store()** |
| | **差异保存优化** | ✅ | **NEW: 比对 lastSavedComponentsRef 避免无变更 API 调用** |
| | **保存状态指示器** | ✅ | **NEW: 居中顶部 Tag 显示"已保存"蓝/未保存红/自动保存中黄/保存中** |
| **回收站** | **软删除页面查询** | ✅ | **NEW: GET /api/pages?deleted=true 仅查询已删除页面** |
| **访问统计** | **PagePV 实体 + StatsService** | ✅ | **NEW: page_pv 表（按日聚合），PV 记录/批量查询 API** |
| | **公开页面 PV 记录** | ✅ | **NEW: 公开接口 GET /public/pages/:slug 异步 PV+1** |
| | **统计 API** | ✅ | **NEW: 总 PV/日趋势/批量查询，GET /pages/:id/stats/total&daily** |
| | **访问量列** | ✅ | **NEW: 页面列表新增"访问量"列，调用批量 API 显示** |
| | **趋势图表** | ✅ | **NEW: SVG 折线图（30 天日 PV，无第三方依赖）** |
| **自定义组件** | **CustomComponent 实体 + Service** | ✅ | **NEW: custom_components 表，含 html/css/script/分类** |
| | **组件注册 API** | ✅ | **NEW: GET/POST/PUT/DELETE /api/page-components** |
| **组件增强** | **多平台视频** | ✅ | **NEW: 新增 B站视频/腾讯视频 blocks** |
| | **图片增强** | ✅ | **NEW: loading="lazy" 懒加载 + alt 描述文本** |
| | **按钮增强** | ✅ | **NEW: inline-flex 图标 + gap 布局** |
| | **动态数据组件** | ✅ | **NEW: 数据列表 + 数据徽标 blocks** |
| | **恢复 API** | ✅ | **NEW: POST /api/pages/:id/restore 恢复软删除页面** |
| | **永久删除 API** | ✅ | **NEW: DELETE /api/pages/:id/hard 彻底删除（仅管理员）** |
| | **回收站页面** | ✅ | **NEW: /trash 路由 + 恢复/永久删除操作 + 危险操作 Popconfirm** |
| **多语言** | **Page locale 字段** | ✅ | **NEW: locale(zh-CN/en) + translationGroupId 分组** |
| | **翻译版本 API** | ✅ | **NEW: GET/POST /api/pages/:id/translations 创建/列出翻译版本** |
| | **TranslationPanel 组件** | ✅ | **NEW: 编辑器多语言管理弹窗（创建翻译版本 + 版本列表）** |
| | **语言标识 UI** | ✅ | **NEW: 页面列表/编辑器顶部 Tag 显示当前语言(中/EN)** |
| **审批流程** | **Page reviewStatus 字段** | ✅ | **NEW: reviewStatus(draft/reviewing/approved/rejected) + reviewComment** |
| | **审批 API** | ✅ | **NEW: 提交审核/通过/驳回 API：PATCH submit-review/approve/reject** |
| | **待审核列表 API** | ✅ | **NEW: GET /api/pages/review/pending 分页查询待审核页面** |
| | **审核状态 UI** | ✅ | **NEW: 页面列表 "审核" 列 + 编辑器顶部审核 Tag** |
| | **提交审核按钮** | ✅ | **NEW: 页面列表 + 编辑器工具栏 "提交审核" 按钮** |
| | **审核管理页** | ✅ | **NEW: /review 路由 + 审核列表（通过/驳回操作）** |
| | **驳回弹窗** | ✅ | **NEW: 驳回原因填写（必填） + 通过自动发布页面** |

---

## 迭代计划总览

| 迭代 | 时间线 | 重点 |
|------|--------|------|
| **MVP** | ✅ 已完成 | 基础 CRUD + 编辑器 + C端渲染 |
| **Iteration 1** | ✅ 已完成 | MVP 补齐（图片上传、SEO）+ 技术债务 + 编辑器 UI 优化 |
| **Iteration 2** | ✅ **已完成** | 功能增强：表单组件 + 导航菜单 + 更多 Blocks |
| **Iteration 3** | ✅ **已完成** | 模板系统：区块保存/复用、页面克隆 |
| **Iteration 4** | ✅ **已完成** | 编辑器体验：自动保存、版本历史、回收站 |
| **Iteration 5** | ✅ **已完成** | 高级功能：统计分析 + 自定义组件 |
| **Iteration 6** | ✅ **已完成** | 多语言 + 审批流程 |
| **Iteration 7** | ✅ **已完成** | 渲染引擎 v1.5：中间件扩展 + 性能优化 + 单元测试 + JSON 编辑面板 |
| **Iteration 8+** | ⏳ 远期 | 高级功能：A/B 测试、组件市场、SEO 增强等 |

---

## 技术债务记录

| # | 问题 | 影响 | 计划 |
|---|------|------|------|
| ~~1~~ | ~~依赖 `synchronize: true` 建表~~ | ✅ **已关闭** | 需要独立的迁移基础设施，非 pages 模块独有问题 |
| ~~2~~ | ~~无图片上传接口~~ | ✅ **已解决** | |
| ~~3~~ | ~~page-api update 使用 PATCH 而非 PUT~~ | ✅ **已解决** | |
| ~~4~~ | ~~搜索仅支持 title 字段~~ | ✅ **已解决** | |
| ~~5~~ | ~~无编辑器 loading 骨架屏~~ | ✅ **已解决** | |
| ~~6~~ | ~~无 ESLint 配置 (editor 项目)~~ | ✅ **已解决** | |

---

## 环境配置

```bash
# 启动开发环境（editor 独立启动）
pnpm run dev:editor     # 端口 5175
pnpm run dev:server     # 端口 8080（必需）
pnpm run dev:web        # 端口 5173（C端渲染时才需要）
```

## 目录结构

```
apps/
├── editor/              # 低代码编辑器
│   └── src/
│       ├── pages/
│       │   ├── Login/       # SSO 登录
│       │   ├── PageList/    # 页面列表管理
│       │   ├── PageEditor/  # GrapesJS 编辑器（含 VersionPanel）
│       │   └── TrashList/   # 回收站（恢复/永久删除）
│       ├── services/        # API + SSO + HTTP
│       ├── store/           # Redux auth slice
│       └── App.tsx
├── server/
│   └── src/
│       └── pages/           # Pages 模块
│           ├── controllers/ # pages.controller + public-pages.controller
│           │                # + public-form.controller + form-submissions.controller
│           │                # + template.controller（模板 CRUD）
│           │                # + version.controller（版本历史）
│           │                # + stats.controller（页面 PV 统计）
│           │                # + component.controller（自定义组件）
│           ├── services/    # pages.service + forms.service + pages-assets.service
│           │                # + template.service（模板 CRUD + 种子数据）
│           │                # + version.service（版本列表/恢复）
│           │                # + stats.service（PV 记录/查询）
│           │                # + component.service（自定义组件 CRUD）
│           ├── dto/         # create/update/page-query/submit-form DTOs
│           │                # + create-template/update-template DTOs
│           ├── entities/    # page.entity + form-submission.entity
│           │                # + block-template.entity + page-version.entity
│           │                # + page-pv.entity + custom-component.entity
│           └── pages.module.ts
└── editor/
└── web/
    └── src/
        ├── pages/page/PageDetail.tsx  # 表单提交 + 交互式 Block 行为
        └── routes/                    # /page/:slug 路由
```
