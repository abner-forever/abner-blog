# 龙码 AI 聊天应用 — 技术文档（面试版）

## 一、技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 18.3 |
| 构建工具 | Vite | 6.3 |
| 语言 | TypeScript | 5.9 |
| UI 组件库 | Ant Design | 6.3 |
| 状态管理 | Redux Toolkit + React Context | 2.8 |
| 服务端数据 | TanStack Query | 5.90 |
| 路由 | React Router DOM | 6.28 |
| 样式 | LESS + CSS Variables | 4.3 |
| HTTP 客户端 | Axios + 原生 Fetch (SSE) | 1.9 |
| Markdown 渲染 | react-markdown + remark-gfm + react-syntax-highlighter | 10.1 |
| 国际化 | i18next + react-i18next | 23.16 |
| 虚拟列表 | @tanstack/react-virtual | 3.13 |
| 模糊搜索 | Fuse.js | 7.3 |
| 截图导出 | modern-screenshot | 4.6 |
| API 代码生成 | Orval | 8.5 |
| Monorepo | pnpm workspace | — |

## 二、项目架构

### 2.1 目录结构

```
apps/chat/src/
├── main.tsx                    # 应用入口
├── App.tsx                     # 根组件（路由、Provider）
├── components/                 # 全局共享组件
├── hooks/                      # 全局 Hooks（useAuth, useAuthCheck）
├── i18n/                       # 国际化配置（zh-CN, zh-TW, en）
├── lib/                        # 第三方库配置（TanStack Query client）
├── pages/
│   ├── auth/Login/             # 登录页
│   └── chat/                   # 核心聊天模块
│       ├── index.tsx           # 页面入口（编排层）
│       ├── types.ts            # 核心类型定义
│       ├── constants.ts        # 常量（模型配置、存储 key）
│       ├── context/            # ChatContext（状态管理核心）
│       ├── components/         # 聊天组件（16+ 个）
│       ├── utils/              # 工具函数（流解析、图片处理等）
│       └── share/              # 分享页
├── services/                   # API 服务层
│   ├── http.ts                 # Axios 实例（拦截器）
│   ├── ai.ts                   # AI 流式对话 + 配置 + 会话管理
│   ├── sso.ts                  # SSO 认证
│   ├── skills.ts               # 技能 CRUD
│   ├── mcp-servers.ts          # MCP 服务器管理
│   ├── knowledge-base.ts       # 知识库管理
│   └── generated/              # Orval 自动生成的 API 客户端
├── store/                      # Redux Store
│   ├── authSlice.ts            # 认证状态
│   ├── themeSlice.ts           # 主题状态（16 种皮肤）
│   └── loginModalSlice.ts      # 登录弹窗状态
├── styles/                     # 全局样式变量
└── utils/                      # 通用工具（设备检测）
```

### 2.2 分层架构

```
┌───────────────────────────────────────────────┐
│                View Layer                      │
│  ChatPage → ChatSidebar / ChatHeader /         │
│  ChatMessageList / ChatInput / WelcomeScreen   │
├───────────────────────────────────────────────┤
│              State Layer                       │
│  ChatContext (useReducer) ← 全局聊天状态        │
│  Redux Store ← 认证、主题、登录弹窗             │
│  TanStack Query ← 服务端数据缓存               │
├───────────────────────────────────────────────┤
│            Service Layer                       │
│  ai.ts (fetch SSE) ← 流式对话                  │
│  http.ts (axios) ← REST API                    │
│  generated/ ← Orval 自动生成                    │
├───────────────────────────────────────────────┤
│             Backend (NestJS)                    │
│  /api/ai/chat/stream ← SSE 流式端点            │
│  /api/ai/config ← 配置管理                     │
│  /api/ai/sessions/* ← 会话 CRUD                │
└───────────────────────────────────────────────┘
```

## 三、核心实现细节

### 3.1 状态管理：ChatContext + useReducer

聊天模块采用 **React Context + useReducer** 模式管理全局状态，而非 Redux。原因：

- 聊天状态（消息列表、会话、输入、配置）高度内聚，适合单一 Context 管理
- useReducer 提供可预测的状态变更，action 类型清晰（30+ 种 action type）
- 避免 Redux 的 boilerplate，减少模块间耦合

**状态结构 (`ChatState`)：**

```typescript
interface ChatState {
  sessions: ChatSession[];         // 所有会话
  currentSessionId: string | null; // 当前会话 ID
  messages: Message[];             // 当前消息列表
  input: string;                   // 输入框内容
  pendingImages: ChatImagePayload[]; // 待发送图片
  loading: boolean;                // 是否正在生成
  vendor: VendorType;              // 当前供应商
  model: string;                   // 当前模型
  temperature: number;             // 温度参数
  maxTokens: number;               // 最大 token
  contextWindow: number;           // 上下文窗口
  thinkingBudget: number;          // 思考预算
  enableThinking: boolean;         // 深度思考开关
  enableWebSearch: boolean;        // 联网搜索开关
  // MCP 工具开关已移除，工作流自动注册所有工具供 LLM 按需调用
  // ... 面板状态、UI 状态
}
```

**关键设计决策：**

- 消息列表使用 `useRef` + `useReducer` 双重引用，确保流式更新时的实时性
- 会话持久化采用 **localStorage + 服务端同步** 双写策略
- localStorage 存储前会清理临时状态（images、webSearchStatus），规范化 Markdown

### 3.2 流式对话 (SSE) 实现

**核心流程：**

```
用户输入 → requestAIChatStream() → fetch('/api/ai/chat/stream')
    ↓
Response.body (ReadableStream) → getReader()
    ↓
循环读取 Uint8Array → TextDecoder 解码 → parseSSEChunk()
    ↓
StreamEvent 分发 → handleChatStreamEvent()
    ↓
dispatch 更新消息状态 → UI 实时渲染
```

**SSE 解析 (`stream-utils.ts`)：**

```typescript
// parseSSEChunk: 解析 SSE 文本为事件对象
// 处理: event: xxx\ndata: xxx\n\n 格式
// 支持多行 data 合并
```

**流式事件类型 (`StreamEventName`)：**

| 事件 | 说明 |
|------|------|
| `thinking_delta` | 思考内容增量 |
| `chat_delta` | 回答内容增量 |
| `web_search_status` | 联网搜索状态 |
| `clarification_needed` | 需要用户补充信息 |
| `todo_created/updated/deleted` | 待办操作结果 |
| `event_created/updated/deleted` | 日程操作结果 |
| `schedule_query` | 日程查询结果 |
| `done` | 流式结束 |
| `error` | 错误 |

**打字机效果：**

```typescript
const TYPEWRITER_BATCH_SIZE = 4;  // 每批渲染字符数
const TYPEWRITER_TICK_MS = 42;    // 刷新间隔 (ms)
```

使用 `useRef` 缓冲区 + `setInterval` 实现平滑的逐字展示效果，避免高频 DOM 更新导致的性能问题。

### 3.3 多模态图片处理

**图片上传流程：**

1. 用户选择/粘贴/拖拽图片
2. `readFileAsChatImage()` 转为 Base64 + 生成预览 URL
3. 存入 `pendingImages` 状态，UI 展示缩略图
4. 发送时随消息一起上传到后端
5. 组件卸载时 `revokeChatImagePreview()` 释放 Object URL

**限制：**
- 最大 5 张图片 (`CHAT_MAX_IMAGES`)
- 支持格式：PNG、JPG、JPEG、WebP、GIF
- 部分供应商不支持图片（DeepSeek）

### 3.4 API Key 安全传输

采用 **RSA-OAEP-256 非对称加密** 保护用户 API Key：

```
前端请求公钥 → /api/ai/config/public-key
    ↓
crypto.subtle.importKey('spki', ...) → CryptoKey
    ↓
crypto.subtle.encrypt({name: 'RSA-OAEP'}, key, plaintext)
    ↓
Base64 编码 → 发送到后端
```

- 公钥缓存在内存中（`cachedConfigTransportPublicKey`），避免重复请求
- 使用 Web Crypto API，非 `jsencrypt` 等第三方库

### 3.5 意图识别与工具调用

后端基于 LangChain + LangGraph 进行意图识别，通过 SSE 事件流返回工具调用结果：

```
用户: "帮我创建一个明天下午3点开会的待办"
    ↓
后端 Intent Detection → identify: create_event
    ↓
Tool Execution → 创建日历事件
    ↓
SSE Events: event_created → done
    ↓
前端: 展示 ResultCards (EventCard)
```

**意图类型 (`IntentName`)：**
- `create_todo` / `update_todo` / `delete_todo`
- `create_event` / `update_event` / `delete_event`
- `query_schedule` / `query_weather`
- `chat`（普通对话）

**富卡片组件 (`ResultCards`)：** 根据不同意图展示结构化卡片（待办卡片、日程卡片、天气卡片等）。

### 3.6 Markdown 渲染

使用 `react-markdown` + `remark-gfm` + `react-syntax-highlighter` 实现：

- GitHub Flavored Markdown 支持（表格、任务列表、删除线等）
- 代码块语法高亮（支持多种语言）
- AI 输出的 Markdown 规范化处理 (`canonicalAssistantMarkdown`)
- 特殊代码块解析（`abner-blog-publish` 用于博客发布）

### 3.7 会话持久化策略

**双写机制：**

```
状态变更 → localStorage (立即)
         → 服务端 API (防抖/批量)
```

- **localStorage**：所有用户（含游客），作为离线缓存
- **服务端同步**：仅登录用户，通过 `/api/ai/sessions/*` 接口
- **会话上限**：50 个 (`MAX_SESSIONS`)
- **存储优化**：清理临时状态后再序列化（images、webSearchStatus 等）

### 3.8 响应式设计

- **桌面端**：侧边栏（260px）+ 主内容区，侧边栏可折叠
- **移动端**：抽屉式会话列表 (`ChatHistoryDrawer`)，使用 Ant Design Drawer 组件
- **设备检测**：`utils/device.ts` 提供 `isMobile` / `isTablet` 判断
- **CSS 方案**：LESS + BEM 命名 + CSS 变量，通过 `variables.less` 全局注入

## 四、组件设计

### 4.1 核心组件职责

| 组件 | 职责 | 行数 |
|------|------|------|
| `ChatPage` | 页面编排，组合所有子组件 | ~360 |
| `ChatContext` | 全局状态管理，业务逻辑 | ~1080 |
| `ChatSidebar` | 会话列表、搜索、用户信息 | ~200 |
| `ChatHeader` | 模型选择、分享、设置入口 | ~150 |
| `ChatInput` | 输入框、图片附件、功能开关 | ~200 |
| `ChatMessageList` | 消息列表、虚拟滚动 | ~250 |
| `MarkdownRenderer` | Markdown 渲染 | ~100 |
| `ResultCards` | 结构化结果卡片 | ~200 |
| `WelcomeScreen` | 欢迎页、建议 | ~80 |
| `KnowledgeBasePanel` | 知识库管理 | ~300 |
| `MCPServerPanel` | MCP 服务器管理 | ~300 |
| `SkillPanel` | 技能管理 | ~200 |
| `ChatSettingsModal` | 设置弹窗（模型、外观等） | ~250 |

### 4.2 组件通信模式

```
ChatProvider (Context)
    ├── ChatSidebar     ← useChat()
    ├── ChatHeader      ← useChat()
    ├── ChatMessageList ← props (messages, loading, ...)
    ├── ChatInput       ← props (value, onChange, onSend, ...)
    ├── WelcomeScreen   ← props (onSuggestionClick)
    └── Panels          ← props (onClose)
```

- 状态密集型组件（Sidebar、Header）通过 `useChat()` 直接消费 Context
- 纯展示组件（MessageList、Input）通过 Props 接收数据，保持可测试性

## 五、关键依赖说明

| 依赖 | 用途 |
|------|------|
| `@tanstack/react-virtual` | 消息列表虚拟滚动，优化长对话性能 |
| `fuse.js` | 会话模糊搜索，支持标题和内容匹配 |
| `modern-screenshot` | 对话截图导出，DOM → Canvas → Image |
| `classnames` | 条件 CSS 类名拼接 |
| `dayjs` | 时间格式化 |
| `@abner-blog/shared-ui` | 共享 UI 组件（登录组件、动画角色等） |
| `@abner-blog/utils` | 共享工具库 |

## 六、API 接口设计

### 6.1 流式对话

```
POST /api/ai/chat/stream
Content-Type: application/json

Request Body:
{
  message: string;          // 用户消息
  images?: ChatImagePart[]; // 图片（Base64）
  currentDate: string;      // 当前日期
  sessionId?: string;       // 会话 ID
  provider?: string;        // AI 供应商
  model?: string;           // 模型名称
  temperature?: number;     // 温度
  maxTokens?: number;       // 最大 token
  contextWindow?: number;   // 上下文窗口
  thinkingEnabled?: boolean;// 深度思考
  thinkingBudget?: number;  // 思考预算
  skillId?: string;         // 指定技能
}

Response: SSE stream (text/event-stream)
```

### 6.2 配置管理

```
POST /api/ai/config          // 保存配置（API Key 加密传输）
POST /api/ai/config/get      // 获取配置
GET  /api/ai/config/public-key // 获取加密公钥
```

### 6.3 会话管理

```
POST /api/ai/sessions/list   // 获取会话列表
POST /api/ai/sessions/save   // 保存会话
POST /api/ai/sessions/delete // 删除会话
```

## 七、性能优化策略

1. **虚拟滚动**：使用 `@tanstack/react-virtual` 对长消息列表进行虚拟化渲染
2. **打字机缓冲**：批量更新（4 字符/42ms）避免高频 re-render
3. **Ref 双引用**：消息列表同时维护 `state` 和 `ref`，流式更新时直接操作 ref 避免闭包陈旧
4. **图片内存管理**：组件卸载时释放 Object URL，避免内存泄漏
5. **公钥缓存**：RSA 公钥缓存在 Promise 中，全局只请求一次
6. **会话序列化优化**：存储前清理临时字段，减少 localStorage 写入量
7. **懒加载**：面板组件（知识库、MCP、技能）按需渲染

## 八、安全设计

1. **API Key 加密**：RSA-OAEP-256 非对称加密，前端加密后传输
2. **JWT 认证**：所有 AI 接口需要 Bearer Token
3. **SSO 集成**：支持 Keycloak 单点登录
4. **输入校验**：前后端双重校验用户输入
5. **CORS 策略**：后端统一配置跨域策略

## 九、可扩展性设计

1. **供应商扩展**：`MODEL_VENDORS` 配置化，新增供应商只需添加配置项
2. **意图扩展**：`StreamEventName` 和 `IntentName` 类型可扩展
3. **技能系统**：通过 Skill 市场动态安装/卸载 AI 技能
4. **MCP 协议**：支持动态接入远程工具服务器
5. **知识库**：支持文档上传和向量检索的 RAG 能力

## 十、面试高频问题参考

### Q: 为什么用 Context + useReducer 而不是 Redux？
**A:** 聊天模块状态高度内聚，30+ 种 action 集中在一个 reducer 中管理更直观。Redux 适合跨模块共享的全局状态（如认证、主题），而聊天状态几乎不被其他模块消费，Context 足够且更轻量。

### Q: SSE 流式输出如何处理断连和错误？
**A:** 通过 `AbortController` 支持用户主动中断；流式读取循环中 try-catch 捕获网络错误；后端发送 `error` 事件时前端统一处理；`done` 事件标记正常结束。

### Q: 如何保证流式更新时的状态一致性？
**A:** 消息列表使用 `useRef` + `useReducer` 双引用。流式更新时通过 ref 操作最新状态，避免闭包捕获过期值。打字机效果使用缓冲区 + 定时器，批量合并增量内容后一次性更新 DOM。

### Q: 图片上传如何处理内存泄漏？
**A:** 使用 `URL.createObjectURL` 生成预览 URL，组件卸载时调用 `URL.revokeObjectURL` 释放。`pendingImages` 状态变更时也会清理被移除项的 Object URL。

### Q: 如何实现多模型切换？
**A:** 后端基于 LangChain 统一抽象不同供应商的 API 差异。前端只需传递 `provider` 和 `model` 参数，后端路由到对应的 LLM 适配器。配置持久化在服务端，加密存储用户的 API Key。
