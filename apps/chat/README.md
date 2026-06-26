# LongMa Chat — 龙码 AI 聊天应用

## 项目简介

LongMa Chat 是龙码 (LongMa) 全栈博客平台中的独立 AI 聊天应用，从主站 `apps/web` 中解耦而来，作为 monorepo 中的第 5 个应用独立运行。它提供了一个功能丰富的多模型 AI 对话界面，支持 6 家 AI 供应商、知识库增强、MCP 工具调用、技能系统等高级功能。

## 核心功能

### 多模型 AI 对话
- 支持 6 家 AI 供应商：OpenAI、Anthropic、Gemini、DeepSeek、通义千问、MiniMax
- SSE 流式响应（基于 fetch + ReadableStream，非 WebSocket）
- 可调节参数：temperature、maxTokens、contextWindow、thinkingBudget
- 思维链展示（Thinking/Typing 动画）

### 会话管理
- 多会话支持，侧边栏会话列表
- 会话持久化：游客使用 localStorage，登录用户同步至服务端
- 最大 50 个会话本地存储
- 会话搜索（Fuse.js 模糊搜索）
- 会话导出为图片（modern-screenshot）

### 知识库增强
- 知识库管理面板，可上传文档构建向量索引
- 对话时可注入知识库上下文，提升回答准确性

### MCP 工具集成
- MCP 服务器管理面板
- 支持动态启用/禁用 MCP 工具
- 工具调用结果可视化

### 技能系统
- 技能管理面板
- 可为对话注入特定技能上下文
- 支持按技能 ID 指定激活

### 分享功能
- 对话分享链接生成（`/chat/share/:shareId`）
- 分享页面独立渲染，无需登录

### 博客发布
- AI 回答中可识别博客发布草稿块
- 一键发布为博客文章

### 其他特性
- 深色/浅色/跟随系统主题切换
- 国际化支持（中文简体、中文繁体、英文）
- 响应式布局，移动端适配
- 图片上传（Base64 编码）
- 代码高亮渲染（react-syntax-highlighter）
- Markdown 渲染（react-markdown + remark-gfm）

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 6 |
| UI 库 | Ant Design 6 |
| 状态管理 | Redux Toolkit + React Context (useReducer) |
| 服务端数据 | TanStack Query |
| 路由 | React Router DOM 6 |
| 样式 | LESS + BEM + CSS 变量 |
| 国际化 | i18next + react-i18next |
| HTTP | Axios + 原生 fetch (SSE) |
| API 生成 | Orval (OpenAPI) |
| Markdown | react-markdown + remark-gfm |
| 代码高亮 | react-syntax-highlighter |
| 截图导出 | modern-screenshot |
| 模糊搜索 | Fuse.js |
| 虚拟列表 | @tanstack/react-virtual |

## 项目结构

```
apps/chat/
├── src/
│   ├── App.tsx                 # 根组件（Provider、路由、SSO 检查）
│   ├── main.tsx                # 入口文件
│   ├── index.less              # 全局样式
│   ├── components/             # 共享组件
│   │   └── CustomEmpty/        # 空状态组件
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useAuth.ts          # 认证 Hook
│   │   └── useAuthCheck.ts     # 认证状态检查
│   ├── i18n/                   # 国际化配置
│   │   ├── index.ts            # i18next 初始化
│   │   └── locales/            # 语言文件（zh-CN, zh-TW, en）
│   ├── lib/                    # 第三方库配置
│   │   └── query/              # TanStack Query Client
│   ├── pages/
│   │   ├── auth/
│   │   │   └── Login/          # 登录页（JWT + SSO）
│   │   └── chat/
│   │       ├── index.tsx       # 聊天主页
│   │       ├── index.less      # 聊天页样式（CSS 变量定义）
│   │       ├── constants.ts    # 常量定义
│   │       ├── types.ts        # TypeScript 类型
│   │       ├── context/
│   │       │   └── ChatContext.tsx  # 核心状态管理（useReducer）
│   │       ├── components/     # 聊天子组件
│   │       │   ├── ChatHeader/         # 顶部导航栏
│   │       │   ├── ChatSidebar/        # 会话列表侧边栏
│   │       │   ├── ChatInput.tsx       # 输入框（支持图片）
│   │       │   ├── ChatMessageList.tsx # 消息列表（虚拟滚动）
│   │       │   ├── ChatSettingsModal/  # 设置弹窗（5 Tab）
│   │       │   ├── ChatSettingsPanel.tsx # 设置面板（已废弃）
│   │       │   ├── ChatHistoryDrawer.tsx # 历史抽屉
│   │       │   ├── ChatConversationPreview.tsx # 会话预览
│   │       │   ├── MarkdownRenderer.tsx # Markdown 渲染
│   │       │   ├── ThinkingTypingView.tsx # 思考动画
│   │       │   ├── WelcomeScreen/      # 欢迎页
│   │       │   ├── ClarificationModal.tsx # 澄清弹窗
│   │       │   ├── ResultCards.tsx      # 结果卡片
│   │       │   ├── BlogPublishDraftCard/ # 博客发布卡片
│   │       │   ├── KnowledgeBasePanel/ # 知识库面板
│   │       │   ├── MCPServerPanel/     # MCP 服务器面板
│   │       │   └── SkillPanel/         # 技能面板
│   │       ├── share/
│   │       │   ├── index.tsx   # 分享页
│   │       │   └── share.less  # 分享页样式
│   │       └── utils/          # 工具函数
│   │           ├── stream-utils.ts           # SSE 解析
│   │           ├── stream-event-handler.ts   # 流事件处理
│   │           ├── assistant-markdown.ts     # Markdown 标准化
│   │           ├── chat-images.ts            # 图片处理
│   │           ├── export-chat-image.ts      # 导出图片
│   │           └── parse-blog-publish-block.ts # 博客草稿解析
│   ├── services/               # API 服务层
│   │   ├── http.ts             # Axios 实例
│   │   ├── ai.ts               # AI 对话 API（SSE 流式）
│   │   ├── knowledge-base.ts   # 知识库 API
│   │   ├── mcp-servers.ts      # MCP 服务器 API
│   │   ├── skills.ts           # 技能 API
│   │   ├── sso.ts              # SSO 认证 API
│   │   └── generated/          # Orval 自动生成
│   │       ├── blogs/
│   │       ├── chat-share/
│   │       ├── model/
│   │       ├── upload/
│   │       └── users/
│   ├── store/                  # Redux Store
│   │   ├── index.ts            # Store 配置
│   │   ├── authSlice.ts        # 认证状态
│   │   ├── themeSlice.ts       # 主题状态
│   │   ├── loginModalSlice.ts  # 登录弹窗状态
│   │   └── reduxHooks.ts       # Typed Hooks
│   ├── styles/                 # 全局样式
│   │   └── variables.less      # LESS 变量
│   └── utils/                  # 通用工具
├── package.json
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── orval.config.ts             # API 代码生成配置
```

## 认证机制

应用支持两种认证方式：

1. **JWT 认证**：用户名密码登录，获取 JWT Token，存储于 `localStorage`（key: `user-token`）
2. **SSO 单点登录**：通过 Keycloak 集成，自动检测 SSO 状态，存储 `sso-session` 标识

登录页面复用 `@abner-blog/shared-ui` 中的 `LoginPage` 组件，保持与管理后台一致的登录体验。

## 主题系统

- Redux `themeSlice` 管理主题状态（system/dark/light）
- `data-theme` 属性挂载到 `document.documentElement`
- Antd `ConfigProvider` 动态切换 `darkAlgorithm` / `defaultAlgorithm`
- CSS 变量 `--ds-*` 在 `index.less` 中定义，深色为默认值
- `[data-theme="light"]` 选择器覆盖浅色主题变量

## 开发命令

```bash
# 开发
pnpm run dev:chat        # 启动开发服务器（端口 3002）

# 构建
pnpm run build:chat      # TypeScript 编译 + Vite 构建

# 代码质量
pnpm run lint             # ESLint 检查
pnpm run typecheck        # TypeScript 类型检查

# API 生成
pnpm run generate:api     # 从 OpenAPI 规范生成 API 客户端
```

## 与后端的交互

- API 基础路径：`/api`（开发环境通过 Vite proxy 转发到 `localhost:8080`）
- AI 对话：`POST /api/ai/chat/stream`（SSE 流式）
- 知识库：`/api/knowledge-base/*`
- MCP 服务器：`/api/mcp/*`
- 技能：`/api/skills/*`
- 聊天分享：`/api/chat-share/*`
- SSO 状态：`/api/sso/status`

## 项目亮点（面试适用）

1. **架构设计**：从大型 monorepo 中解耦独立应用，保持代码复用的同时实现独立部署
2. **状态管理**：Redux Toolkit（全局状态）+ React Context + useReducer（业务状态）混合架构
3. **流式通信**：基于原生 fetch + ReadableStream 的 SSE 实现，支持流式 Markdown 渲染
4. **多模型支持**：抽象供应商层，支持 6 家 AI 服务无缝切换
5. **安全设计**：RSA-OAEP-256 加密传输 API Key
6. **性能优化**：虚拟列表、懒加载、消息批处理更新
7. **主题系统**：CSS 变量 + data-theme + antd ConfigProvider 三重保障
8. **国际化**：完整的 i18n 方案，覆盖中英繁三语
