# LongMa Chat 技术文档

> 面试准备用技术文档，涵盖架构设计、核心实现、技术难点与解决方案

---

## 一、整体架构

### 1.1 应用定位

LongMa Chat 是从 `apps/web`（主站）中解耦出的独立 AI 聊天应用。解耦原因：
- 聊天模块代码量大（~47 个文件，14,500+ 行），与主站业务逻辑差异大
- 独立部署需求，聊天服务可能需要不同的扩展策略
- 独立认证体系（支持 SSO 单点登录）

### 1.2 架构分层

```
┌─────────────────────────────────────────────────┐
│                   View Layer                     │
│  React Components + CSS Variables + Ant Design   │
├─────────────────────────────────────────────────┤
│                State Management                  │
│  Redux Toolkit (auth/theme) + Context+Reducer    │
│                (chat business state)             │
├─────────────────────────────────────────────────┤
│                 Service Layer                    │
│  Axios (REST) + Fetch+SSE (streaming) + Orval    │
├─────────────────────────────────────────────────┤
│                Backend API                       │
│  NestJS (port 8080) — /api/ai/*, /api/mcp/* ... │
└─────────────────────────────────────────────────┘
```

### 1.3 双状态管理架构

| 状态类型 | 管理方案 | 用途 |
|---------|---------|------|
| 全局应用状态 | Redux Toolkit | 认证 (authSlice)、主题 (themeSlice)、登录弹窗 (loginModalSlice) |
| 聊天业务状态 | React Context + useReducer | 会话列表、消息、AI 配置、UI 面板状态 |
| 服务端数据 | TanStack Query | 用户信息、博客数据等服务端缓存 |

**为什么聊天状态不用 Redux？**
- 聊天状态复杂度高（30+ action types），状态树嵌套深
- useReducer 更适合这种集中式业务逻辑，避免 Redux 的 boilerplate `Boilerplate 指"模板化的重复代码"。`
- 状态更新频率高（流式消息每秒多次更新），useReducer 性能更可控

---

## 二、核心模块详解

### 2.1 SSE 流式通信

**技术选型**：原生 `fetch` + `ReadableStream`，而非 WebSocket

**原因**：
- AI 对话是单向流式（服务端→客户端），不需要双向通信
- HTTP 更简单，无需维护连接状态
- 天然支持断线重连（重新发起请求即可）

**实现流程**：

```typescript
// services/ai.ts
const response = await fetch('/api/ai/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...authHeaders },
  body: JSON.stringify({ message, provider, model, ... }),
  signal, // AbortController 支持取消
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  // 解析 SSE 格式的 chunk
  parseSSEChunk(chunk);
}
```

**SSE 事件类型**：

```typescript
type StreamEventName =
  | 'intent'              // 意图识别结果
  | 'chat'                // 普通对话
  | 'clarification_needed' // 需要用户澄清
  | 'thinking_delta'      // 思维链增量
  | 'chat_delta'          // 回答增量
  | 'web_search_status'   // 联网搜索状态
  | 'todo_created'        // 待办创建
  | 'event_created'       // 日程创建
  | 'done'                // 流结束
  | 'error';              // 错误
```

**打字机效果**：
```typescript
const TYPEWRITER_BATCH_SIZE = 4;  // 每批渲染 4 个字符
const TYPEWRITER_TICK_MS = 42;    // 每 42ms 渲染一批
```

### 2.2 ChatContext 状态管理

**核心状态结构**：

```typescript
interface ChatState {
  // 会话
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  
  // 输入
  input: string;
  pendingImages: ChatImagePayload[];
  inputFocused: boolean;
  
  // UI 状态
  loading: boolean;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  
  // AI 配置
  apiKeys: Record<string, string>;
  vendor: VendorType;       // 当前供应商
  model: string;            // 当前模型
  temperature: number;      // 温度参数
  maxTokens: number;        // 最大 token
  contextWindow: number;    // 上下文窗口
  thinkingBudget: number;   // 思维链预算
  enableThinking: boolean;  // 是否启用思维链
  enableWebSearch: boolean; // 是否启用联网搜索
  // MCP 工具：工作流自动注册，由 LLM 按需调用，不再通过前端开关控制
  
  // 面板
  showKnowledgeBase: boolean;
  showMCPServer: boolean;
  showSkill: boolean;
  showChatSettings: boolean;
}
```

**30+ Action Types** 分类：
- 会话管理：`SET_SESSIONS`, `ADD_SESSION`, `DELETE_SESSION`, `UPDATE_SESSION`
- 消息操作：`SET_MESSAGES`, `ADD_MESSAGE`, `UPDATE_MESSAGE`, `UPDATE_MESSAGES_BATCH`
- 配置更新：`SET_VENDOR`, `SET_MODEL`, `SET_TEMPERATURE`, `SET_API_KEYS`
- UI 控制：`SET_SIDEBAR_COLLAPSED`, `SET_SHOW_KNOWLEDGE_BASE`, `SET_SHOW_CHAT_SETTINGS`

### 2.3 认证系统

**双认证模式**：

```typescript
interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  authMethod: 'jwt' | 'sso' | null;
}
```

**JWT 认证流程**：
1. 用户输入用户名密码 → `POST /api/auth/login`
2. 获取 JWT Token → 存储 `localStorage.setItem('user-token', token)`
3. 后续请求携带 `Authorization: Bearer ${token}`

**SSO 认证流程**：
1. 应用启动 → `App.tsx` 中 `checkSSO()` 调用 `getSSOStatus()`
2. 检测 Keycloak SSO 状态 → 若已认证，获取用户信息
3. 存储 `sso-session` 标识（非 JWT，是特殊字符串）
4. 后续请求携带此标识，后端通过 SSO 中间件验证

**关键实现**：
```typescript
// App.tsx - SSO 检查
const checkSSO = async () => {
  const status = await getSSOStatus();
  if (status.authenticated && status.userId && status.username) {
    dispatch(setSSOCredentials({
      id: status.userId,
      username: status.username,
      email: status.email,
    }));
  }
};
```

### 2.4 主题系统

**三层主题方案**：

1. **Redux 状态层**：`themeSlice` 存储 theme (system/dark/light)
2. **DOM 属性层**：`document.documentElement.setAttribute('data-theme', theme)`
3. **CSS 变量层**：`--ds-*` 变量在 `index.less` 中定义

```less
// index.less - CSS 变量定义（深色为默认）
:root {
  --ds-bg-primary: #1a1a1a;
  --ds-bg-secondary: #2a2a2a;
  --ds-text-primary: #e0e0e0;
  --ds-border-color: #3a3a3a;
  // ...
}

[data-theme="light"] {
  --ds-bg-primary: #ffffff;
  --ds-bg-secondary: #f5f5f5;
  --ds-text-primary: #333333;
  --ds-border-color: #e0e0e0;
  // ...
}
```

4. **Antd 主题层**：`ConfigProvider` 动态切换算法

```tsx
<ConfigProvider
  theme={{
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  }}
>
```

**为什么用 CSS 变量而不是 LESS 变量？**
- CSS 变量支持运行时动态切换
- LESS 变量在编译时确定，无法动态修改
- CSS 变量可以被 JavaScript 读取和修改

### 2.5 API Key 安全传输

**RSA-OAEP-256 加密方案**：

```typescript
// 1. 获取服务端公钥
const publicKey = await getConfigTransportPublicKey();
// 公钥缓存，避免重复请求
let cachedConfigTransportPublicKey: Promise<CryptoKey> | null = null;

// 2. 加密 API Key
const encryptedEntries = await Promise.all(
  providers.map(async (provider) => {
    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      key,
      encoder.encode(apiKeys[provider]),
    );
    return [provider, bytesToBase64(new Uint8Array(cipherBuffer))];
  })
);

// 3. 发送加密后的数据
await fetch('/api/ai/config', {
  method: 'POST',
  body: JSON.stringify({ ...payload, encryptedApiKeys }),
});
```

**为什么前端加密？**
- API Key 是用户敏感信息，不应明文传输
- 即使 HTTPS 已加密，多一层端到端加密更安全
- 服务端只有私钥能解密，前端无法泄露明文

---

## 三、组件设计

### 3.1 组件结构

```
chat/
├── index.tsx              # 页面入口，组装所有子组件
├── context/ChatContext.tsx # 状态管理中心
├── components/
│   ├── ChatHeader/        # 顶部栏（模型选择、设置入口）
│   ├── ChatSidebar/       # 左侧会话列表
│   ├── ChatInput.tsx      # 底部输入框
│   ├── ChatMessageList.tsx # 消息列表（核心）
│   ├── ChatSettingsModal/ # 设置弹窗（5 Tab）
│   ├── MarkdownRenderer.tsx # Markdown 渲染
│   ├── WelcomeScreen/     # 欢迎页
│   └── ...                # 其他功能组件
```

### 3.2 ChatMessageList 核心实现

**虚拟滚动优化**：
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// 大量消息时只渲染可见区域
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100, // 估算每条消息高度
  overscan: 5,             // 额外渲染 5 条
});
```

**消息状态机**：
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;           // 原始内容
  displayContent: string;    // 渲染内容
  thinkingContent?: string;  // 思维链内容
  thinkingStatus?: 'idle' | 'streaming' | 'done';
  answerStatus?: 'idle' | 'streaming' | 'done';
  webSearchStatus?: 'idle' | 'searching' | 'done';
  card?: AssistantCard;      // 结果卡片
  images?: Array<{...}>;     // 图片
  blogPublishDraft?: CreateBlogDto; // 博客草稿
}
```

### 3.3 设置弹窗设计

**5 Tab 结构**：

```
ChatSettingsModal/
├── ModelTab.tsx      # 模型配置（供应商、模型、参数）
├── ChatTab.tsx       # 聊天配置（上下文窗口、思维链、MCP）
├── ProfileTab.tsx    # 个人信息（头像、昵称）
├── AppearanceTab.tsx # 外观设置（主题切换）
└── AboutTab.tsx      # 关于信息
```

**设计决策**：合并了原来的 `ChatSettingsModal` 和 `ChatSettingsPanel`（Popover 形式），统一为一个 5 Tab 弹窗，避免用户困惑。

---

## 四、性能优化

### 4.1 消息批处理更新

```typescript
// 避免每收到一个 chunk 就触发 re-render
const TYPEWRITER_BATCH_SIZE = 4;
const TYPEWRITER_TICK_MS = 42;

// 批量收集 chunk，定时更新
case 'UPDATE_MESSAGES_BATCH':
  return { ...state, messages: action.payload(state.messages) };
```

### 4.2 懒加载

```typescript
const ChatPage = React.lazy(() => import('@/pages/chat'));
const ChatSharePage = React.lazy(() => import('@/pages/chat/share'));

// Suspense 包裹
<React.Suspense fallback={<Spin size="large" />}>
  <Routes>...</Routes>
</React.Suspense>
```

### 4.3 会话持久化策略

- **游客**：`localStorage` 存储，最大 50 个会话
- **登录用户**：双写策略（localStorage + 服务端同步）
- **会话排序**：按 `timestamp` 降序，最近使用的在最上面

```typescript
const sortSessionsByLatest = (sessions: ChatSession[]): ChatSession[] =>
  [...sessions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
```

### 4.4 虚拟列表

消息列表使用 `@tanstack/react-virtual`，只渲染可见区域的消息，避免长会话导致的性能问题。

---

## 五、工程化实践

### 5.1 API 代码生成

使用 Orval 从 OpenAPI 规范自动生成 TypeScript 类型和 API 客户端：

```typescript
// orval.config.ts
export default defineConfig({
  chat: {
    input: {
      target: '../server/src/**/*.controller.ts',
    },
    output: {
      target: './src/services/generated/',
      client: 'axios',
    },
  },
});
```

生成目录：
- `generated/blogs/` - 博客相关 API
- `generated/chat-share/` - 聊天分享 API
- `generated/model/` - 模型相关 API
- `generated/upload/` - 文件上传 API
- `generated/users/` - 用户相关 API

### 5.2 国际化方案

```typescript
// i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { 'zh-CN': {...}, 'zh-TW': {...}, en: {...} },
    fallbackLng: 'zh-CN',
  });
```

**使用方式**：
```tsx
const { t } = useTranslation();
return <span>{t('chat.welcome')}</span>;
```

### 5.3 路径别名

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
    '@components': resolve(__dirname, 'src/components'),
    '@pages': resolve(__dirname, 'src/pages'),
    '@services': resolve(__dirname, 'src/services'),
    '@store': resolve(__dirname, 'src/store'),
    '@hooks': resolve(__dirname, 'src/hooks'),
    '@utils': resolve(__dirname, 'src/utils'),
  },
},
```

---

## 六、技术难点与解决方案

### 6.1 SSE 流式解析

**问题**：SSE 格式的数据可能被拆分成多个 chunk，需要正确拼接和解析。

**解决方案**：
```typescript
// stream-utils.ts
export const parseSSEChunk = (chunk: string): StreamEvent[] => {
  const events: StreamEvent[] = [];
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        events.push(JSON.parse(data));
      } catch {
        // 不完整的 JSON，等待下一个 chunk
      }
    }
  }
  return events;
};
```

### 6.2 思维链渲染

**问题**：AI 的思维链（thinking）需要特殊渲染，且支持折叠/展开。

**解决方案**：
```typescript
// 消息状态分离
interface Message {
  thinkingContent?: string;   // 思维链内容
  thinkingStatus?: 'idle' | 'streaming' | 'done';
  answerStatus?: 'idle' | 'streaming' | 'done';
}

// 展开状态管理
expandedThinkingMessageIds: Set<string>;

// 切换展开
case 'TOGGLE_THINKING_EXPANDED':
  const newSet = new Set(state.expandedThinkingMessageIds);
  if (newSet.has(action.payload)) {
    newSet.delete(action.payload);
  } else {
    newSet.add(action.payload);
  }
  return { ...state, expandedThinkingMessageIds: newSet };
```

### 6.3 多模型供应商抽象

**问题**：6 家 AI 供应商的 API 格式不同，需要统一抽象。

**解决方案**：
```typescript
// 类型定义
enum VendorType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  QWEN = 'qwen',
  MINIMAX = 'minimax',
}

// 服务端统一处理
interface ChatStreamRequest {
  provider?: VendorType;
  model?: string;
  // ... 其他参数统一
}
```

服务端根据 `provider` 字段路由到不同的 AI 服务适配器。

### 6.4 图片上传

**问题**：图片需要支持预览和 Base64 编码传输。

**解决方案**：
```typescript
// chat-images.ts
export interface ChatImagePayload {
  mimeType: string;
  previewUrl: string;   // 本地预览 URL
  dataBase64: string;   // Base64 编码
}

// 上传流程
const handleImageUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = (reader.result as string).split(',')[1];
    dispatch({
      type: 'SET_PENDING_IMAGES',
      payload: [...state.pendingImages, {
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
        dataBase64: base64,
      }],
    });
  };
  reader.readAsDataURL(file);
};
```

### 6.5 博客发布草稿解析

**问题**：AI 回答中可能包含博客发布草稿（特殊代码块），需要解析并提供发布按钮。

**解决方案**：
```typescript
// parse-blog-publish-block.ts
export const parseAbnerBlogPublishDraft = (content: string): CreateBlogDto | null => {
  const regex = /```abner-blog-publish\n([\s\S]*?)\n```/;
  const match = content.match(regex);
  if (!match) return null;
  
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
};

// 消息中存储解析结果
interface Message {
  blogPublishDraft?: CreateBlogDto | null;
  blogPublished?: { id: number; title: string } | null;
}
```

---

## 七、代码质量保障

### 7.1 TypeScript 严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 7.2 ESLint 配置

```javascript
// eslint.config.js (Flat Config)
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
    },
  },
);
```

### 7.3 测试策略

```bash
# 单元测试
pnpm run test:unit        # Vitest

# E2E 测试
pnpm run test:e2e:web     # Playwright

# 类型检查
pnpm run typecheck        # tsc --noEmit

# Lint
pnpm run lint             # ESLint
```

---

## 八、面试常见问题

### Q1: 为什么用 Context + useReducer 而不是 Redux 管理聊天状态？

**A**:
1. 聊天状态是页面级状态，不需要跨页面共享
2. 30+ action types 的复杂度更适合 useReducer 的集中式处理
3. 流式消息更新频率高，useReducer 的 dispatch 比 Redux 更轻量
4. 避免 Redux 的 boilerplate（action creators, selectors 等）

### Q2: SSE 和 WebSocket 的区别？为什么选 SSE？

**A**:
- **SSE**：单向（服务端→客户端），基于 HTTP，自动重连，实现简单
- **WebSocket**：双向通信，需要维护连接状态，实现复杂
- AI 对话场景只需要服务端推流，SSE 足够且更简单

### Q3: 如何处理流式消息的性能问题？

**A**:
1. 批量更新：`TYPEWRITER_BATCH_SIZE = 4`，每 42ms 批量渲染
2. 虚拟列表：`@tanstack/react-virtual` 只渲染可见区域
3. 消息状态分离：thinking/answer/webSearch 独立状态，避免全量 re-render
4. 打字机效果：控制渲染频率，避免卡顿

### Q4: API Key 为什么用 RSA 加密？

**A**:
1. 端到端加密，即使 HTTPS 被中间人攻击也无法获取明文
2. 前端用公钥加密，只有服务端私钥能解密
3. 公钥缓存，避免每次请求都获取
4. 符合安全最佳实践

### Q5: 主题切换如何实现？

**A**:
四层方案：
1. Redux 存储主题状态
2. DOM 属性 `data-theme` 挂载到根元素
3. CSS 变量 `--ds-*` 动态切换
4. Antd ConfigProvider 动态切换算法

CSS 变量支持运行时切换，比 LESS 变量更灵活。

### Q6: 如何处理会话持久化？

**A**:
- 游客：localStorage，最大 50 个会话
- 登录用户：双写（localStorage + 服务端同步）
- 启动时：先加载 localStorage，再从服务端同步，合并去重

### Q7: 如何保证代码质量？

**A**:
1. TypeScript 严格模式（noImplicitAny, strictNullChecks）
2. ESLint + react-hooks 插件
3. Orval 自动生成 API 类型（类型安全）
4. 单元测试 + E2E 测试
5. Pre-commit hooks（lint 检查）

---

## 九、项目数据

| 指标 | 数值 |
|------|------|
| 聊天页面文件数 | ~47 个 |
| 代码行数 | ~14,500 行 |
| Action Types | 30+ |
| AI 供应商 | 6 家 |
| 国际化语言 | 3 种 |
| 组件数 | 18 个 |
| 工具函数 | 8 个 |
| API 服务文件 | 7 个 |

---

## 十、技术栈总结

```
前端框架: React 18 + TypeScript
构建工具: Vite 8
UI 组件: Ant Design 6
状态管理: Redux Toolkit + React Context + useReducer
服务端数据: TanStack Query
路由: React Router DOM 6
样式方案: LESS + BEM + CSS 变量
国际化: i18next + react-i18next
HTTP 客户端: Axios (REST) + Fetch (SSE)
API 生成: Orval (OpenAPI)
Markdown: react-markdown + remark-gfm
代码高亮: react-syntax-highlighter
虚拟列表: @tanstack/react-virtual
模糊搜索: Fuse.js
截图导出: modern-screenshot
```
