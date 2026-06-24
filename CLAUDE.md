# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

**龙码 (LongMa)** — 基于 **pnpm monorepo** 架构的全栈博客 + 低代码平台系统，包含四个应用：

| 应用            | 技术栈                                                            | 端口 |
| --------------- | ----------------------------------------------------------------- | ---- |
| `apps/server` | NestJS 11 + TypeORM + MySQL + Redis + JWT（服务端）                 | 8080 |
| `apps/web` | React 18 + Vite 6 + Ant Design 6 + Redux Toolkit + TanStack Query（用户站） | 3000 |
| `apps/admin`    | React 18 + Vite 6 + Ant Design 6 + ECharts（管理后台）            | 3001 |
| `apps/editor`   | React 18 + Vite 8 + GrapesJS Studio SDK（低代码页面编辑器）       | 5175 |

## 常用命令

```bash
# 开发
pnpm run dev              # 并行启动 web + server
pnpm run dev:server       # 仅启动后端 (nest start --watch)
pnpm run dev:web          # 仅启动用户站
pnpm run dev:admin        # 启动管理后台
pnpm run dev:editor       # 启动低代码编辑器
pnpm run dev:services     # 启动 Docker 服务 (MySQL, Redis 等)

# 构建
pnpm run build            # 构建 web + server
pnpm run build:server     # 仅构建后端
pnpm run build:web        # 仅构建用户站
pnpm run build:admin      # 仅构建管理后台
pnpm run build:editor     # 仅构建编辑器

# 质量检查
pnpm run lint             # 对所有项目运行 ESLint（含 editor）
pnpm run typecheck        # 运行 TypeScript 类型检查（含 editor）
pnpm run test:unit        # 运行单元测试（后端 jest + 前端 vitest）
pnpm run check:ci         # lint + typecheck + test:unit（提交前运行）

# E2E 测试
pnpm run test:e2e:server  # 后端 e2e 测试
pnpm run test:e2e:web     # 前端 e2e 测试 (Playwright)

# API 代码生成
pnpm run generate:api     # 从 OpenAPI 规范生成 API 客户端 (orval)
```

## 架构

### Monorepo 结构

```
apps/
├── server/           # NestJS 服务端（REST API + WebSocket）
│   └── src/
│       ├── auth/           # JWT 认证 (passport-jwt)
│       ├── users/          # 用户管理
│       ├── blogs/          # 博客 CRUD，含标签、分页
│       ├── comments/       # 评论系统
│       ├── likes/          # 点赞
│       ├── favorites/      # 收藏
│       ├── todos/          # 待办事项
│       ├── calendar/       # 日程管理
│       ├── notes/          # 笔记（类 Notion 富文本）
│       ├── note-collections/ # 笔记合集
│       ├── moments/        # 动态/朋友圈
│       ├── topics/         # 话题
│       ├── ai/             # AI 聊天（LangChain + LangGraph）
│       ├── mcp/            # MCP 协议服务端（内置工具 + 远程服务器管理）
│       ├── knowledge-base/ # 知识库（向量检索）
│       ├── skills/         # AI 技能管理
│       ├── social/         # 社交（关注、私信、通知、WebSocket）
│       ├── chat-share/     # 聊天分享
│       ├── pages/          # 低代码页面管理（模板、版本、表单提交）
│       ├── web-search/     # 网页搜索
│       ├── weather/        # 天气服务
│       ├── hotsearch/      # 热搜
│       ├── analytics/      # 埋点 + 性能监控
│       ├── upload/         # 文件上传（分片、视频封面）
│       ├── modules/admin/  # 管理后台专用模块
│       ├── modules/sso/    # SSO 单点登录（Keycloak）
│       ├── entities/       # TypeORM 实体（42+ 个）
│       ├── common/         # Guards、Interceptors、Filters、Logger
│       └── config/         # 配置
├── web/              # 用户端 React 应用
│   └── src/
│       ├── pages/          # 页面组件（按路由组织）
│       │   ├── home/       # 首页（Hero + Feature + 最新内容）
│       │   ├── blog/       # 博客（列表、创建、编辑、详情）
│       │   ├── chat/       # AI 聊天（含分享、设置面板）
│       │   ├── todo/       # 待办（列表 + Schedule-X 日历视图）
│       │   ├── note/       # 笔记（列表、创建、详情、话题）
│       │   ├── moment/     # 动态（列表、创建、详情）
│       │   ├── news/       # 资讯
│       │   ├── messages/   # 私信（WebSocket）
│       │   ├── notifications/ # 通知 + 系统公告
│       │   ├── search/     # 搜索
│       │   ├── page/       # 低代码页面渲染（page-schema）
│       │   ├── user/       # 个人中心（主页、编辑、简历）
│       │   ├── about/      # 关于页
│       │   ├── tools/      # 工具集
│       │   ├── interview/  # 面试题
│       │   ├── demo/       # 演示
│       │   └── auth/       # 登录、注册、忘记密码、MCP 授权
│       ├── components/     # 共享组件
│       ├── services/       # API 层 (http.ts + generated/ + 各业务模块)
│       ├── store/          # Redux slices (auth, theme)
│       ├── hooks/          # 自定义 hooks
│       ├── i18n/           # 国际化配置
│       ├── context/        # React Context
│       └── styles/         # 全局样式、变量
├── admin/            # 管理后台
│   └── src/
│       ├── pages/          # 页面
│       │   ├── dashboard/  # 仪表盘
│       │   ├── user/       # 用户管理
│       │   ├── blog/       # 博客管理
│       │   ├── moment/     # 动态管理
│       │   ├── comment/    # 评论管理
│       │   ├── system-announcement/ # 系统公告
│       │   ├── analytics/  # 数据分析（埋点、性能、用户列表、用户详情）
│       │   └── auth/       # 登录
│       ├── services/       # API 层 (Orval 生成)
│       ├── store/          # Redux slices
│       └── i18n/           # 国际化
└── editor/           # 低代码页面编辑器
    └── src/
        ├── pages/
        │   ├── HomeDashboard/  # 编辑器首页仪表盘
        │   ├── PageEditor/     # GrapesJS 可视化编辑器
        │   ├── PageList/       # 页面列表
        │   ├── PagePreview/    # 页面预览
        │   ├── VersionList/    # 版本历史
        │   ├── ReviewList/     # 审核列表
        │   └── TrashList/      # 回收站
        ├── components/     # 编辑器专用组件
        ├── services/       # API 层
        ├── store/          # Redux slices
        └── locales/        # 国际化

packages/
├── utils/            # 共享工具库
├── upload/           # 文件上传工具（分片上传、直传、预览）
├── page-schema/      # 页面渲染引擎（组件注册、中间件、事件系统、模态框）
├── shared-ui/        # 共享 UI 组件（登录、动画角色等）
├── analytics/        # 埋点 SDK（自动追踪、性能监控、队列上报）
└── env-tool/         # 环境工具（CSS 注入、DOM 工具、UI 组件）
```

### 后端模式

- **认证**：JWT + `passport-jwt`，守卫：`JwtAuthGuard`、`OptionalJwtAuthGuard`
- **SSO**：Keycloak 集成（`modules/sso/`），支持 SSO 单点登录
- **验证**：DTO 使用 `class-validator` 装饰器
- **响应**：通过 `TransformInterceptor` 统一格式 - `{ data, message, timestamp }`
- **错误处理**：全局 `HttpExceptionFilter`
- **日志**：`RootFileLogger` 文件日志 + `LoggingInterceptor` 请求日志
- **数据库**：TypeORM + MySQL，实体位于 `src/entities/`（42+ 个实体）
- **WebSocket**：`social.gateway.ts` 实现实时私信和通知推送
- **AI 能力**：LangChain + LangGraph 驱动的 AI 聊天（意图识别、命令处理、流式输出）
- **MCP 协议**：`@modelcontextprotocol/sdk` 实现内置工具端点 + 远程 MCP 服务器管理
- **低代码页面**：`pages/` 模块管理页面 CRUD、模板、版本、表单提交、自定义组件

### 前端模式

- **路径别名**：使用 `@/`、`@components/`、`@services/`、`@store/`、`@hooks/`（tsconfig 配置）
- **API 调用**：统一通过 `@services/http.ts`，禁止直接使用 axios。Orval 自动生成 `services/generated/`
- **状态管理**：
  - 全局应用状态 → Redux Toolkit（auth、theme）
  - 服务端数据 → TanStack Query（blogs、comments、notes 等）
  - URL 状态 → `useSearchParams`
- **样式**：LESS + BEM 命名，全局变量在 `styles/variables.less`（自动注入）
- **国际化**：所有用户可见文本必须使用 `useTranslation()` hook
- **页面渲染**：低代码页面通过 `page-schema` 包渲染（组件注册、中间件、事件系统）
- **日历**：Schedule-X 替代 antd Calendar，自定义 HTML5 拖拽
- **聊天**：WebSocket 实时通信 + SSE 流式 AI 响应

## 开发规范

### 后端 (NestJS)

详细文档：`docs/DEVELOPMENT_NESTJS.md`

- Controller 保持轻量（仅路由），Service 处理业务逻辑
- 所有请求/响应使用 DTO + `class-validator`
- API 路径遵循 REST 风格：`/api/resource`
- 分页参数：`page` / `pageSize`

### 前端 (React)

详细文档：`docs/DEVELOPMENT_REACT.md`

- **组件文件结构**：React imports → 内部 imports → 类型定义 → 组件实现 → export
- **禁止**：`any` 类型、硬编码颜色、硬编码 API URL、硬编码用户文本
- **必须**：Loading 状态（Spin/Skeleton）、空状态（CustomEmpty）、错误处理、所有文本国际化
- **危险操作**：必须使用 `Popconfirm` 二次确认
- **大型组件**：超过 200 行需拆分，页面使用懒加载

### 样式规范 (CSS/LESS)

#### 优先级规则（避免 `!important`）

**优先级从高到低**：内联 style → ID 选择器 → 类/伪类/属性选择器 → 元素/伪元素选择器 → 通配符

**覆盖 antd 等第三方库全局样式**的正确方式（按优先级从高到低）：

1. **使用原生 HTML 元素**（绕过第三方类名）

   ```tsx
   // ✅ 好：原生 input 不受 .ant-input 影响
   <input className="title-input" />

   // ❌ 差：antd Input 受全局 !important 约束
   <Input className="title-input" />
   ```

2. **使用更高优先级的选择器**（推荐）

   ```less
   // ✅ 好：上下文限定提高优先级
   .page-container {
     .custom-input {
       background: var(--bg-color); // 可覆盖全局 .ant-input !important
     }
   }

   // ❌ 差：直接用低优先级类名
   .custom-input {
     background: var(--bg-color); // 无法覆盖 .ant-input !important
   }
   ```

3. **增加选择器数量**

   ```less
   // ✅ 好：两个类选择器叠加，优先级高于单个类
   .sidebar .summary-textarea.ant-input-textarea {
     ...;
   }
   ```

4. **必要时使用 `!important`**（最后手段）
   - 仅用于覆盖第三方库（如 antd）的全局 `!important` 样式
   - 在该场景下，使用 `!important` 是合理的，但需添加注释说明原因
   ```less
   // 覆盖 antd 全局 .ant-input !important（第三方库强制样式）
   .juejin-editor__sidebar .summary-textarea {
     background: var(--bg-color) !important;
   }
   ```

#### 其他规范

- **禁止**硬编码颜色值，必须使用 LESS/CSS 变量
- **BEM 命名**：`.模块__元素--修饰符`
- **嵌套限制**：LESS 嵌套不超过 3 层
- **变量文件**：`src/styles/variables.less` 定义全局变量（自动注入）
- **组件样式**：优先放在组件目录下 `index.less`，而非全局文件

## API 响应格式

```typescript
// 成功
{ data: T, message: string, timestamp: string }

// 分页列表
{ list: T[], total: number, page: number, pageSize: number, totalPages: number }

// 错误
{ statusCode: number, message: string, timestamp: string, path: string }
```

## 数据库

MySQL + TypeORM。核心实体关系：

- `User` → `Blog` (1:N) → `Comment`、`Like`、`Favorite`、`ViewLog`
- `User` → `Todo` (1:N)
- `User` → `Note` (1:N) → `NoteComment`、`NoteLike`、`NoteFavorite`、`NoteViewLog`
- `User` → `Moment` (1:N) → `MomentComment`、`MomentLike`、`MomentFavorite`、`MomentViewLog`
- `User` → `CalendarEvent` (1:N)
- `User` → `UserResume` (1:1)
- `User` → `UserAIConfig` (1:1)
- `User` → `UserFollow` (关注关系)
- `User` → `DirectConversation` → `DirectMessage`（私信）
- `User` → `UserNotification`（通知）
- `User` → `SSOIdentity`（SSO 身份）
- `Blog` → `tags`（字符串数组）
- `Note` → `NoteCollection` → `NoteCollectionItem`（笔记合集）
- `KnowledgeBase` → `KnowledgeChunk`（知识库 + 向量分块）
- `Page` → `PageVersion`、`FormSubmission`、`PagePV`、`CustomComponent`、`BlockTemplate`
- `MCPServer`（MCP 远程服务器配置）
- `Skill`（AI 技能）
- `SystemAnnouncement`（系统公告）
- `ShareSession`（聊天分享会话）
- `ChatSession`（AI 聊天会话）
- `TrackEvent`、`PerformanceMetric`（埋点 + 性能监控）
- `SiteViewLog`（站点访问统计）

## Git 工作流

- 提交格式：`feat(module): description`、`fix(module): description`
- 使用 `pnpm run commit` 进行交互式提交（Commitizen）
- Pre-commit 钩子：lint 检查
- Commit-msg 钩子：约定式提交格式验证
