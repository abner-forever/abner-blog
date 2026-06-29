# MCP (Model Context Protocol) — 面试准备文档

## 一、什么是 MCP？

**MCP (Model Context Protocol)** 是 Anthropic 在 2024 年底发布的一个开放协议，用于标准化 AI 模型（LLM）与外部工具/数据源之间的通信。

类比理解：
- **MCP 之于 AI 工具调用** ≈ **USB 之于外设**
- 过去每个 AI 应用都要自己写一套工具调用逻辑；有了 MCP，只要按标准协议实现 Server，任何支持 MCP 的 Client（如 Claude Desktop、Cursor、VS Code Copilot）都能直接对接。

核心价值：
1. **统一协议**：AI 模型不再需要为每个工具写不同的集成代码
2. **生态复用**：一个 MCP Server 可以被多个 AI Client 复用
3. **安全隔离**：Server 端控制数据暴露范围，Client 端控制用户授权

## 二、MCP 架构

```
┌─────────────┐     JSON-RPC 2.0      ┌──────────────┐
│  MCP Client │ ◄──────────────────► │  MCP Server   │
│  (AI 模型端) │   (HTTP/SSE/stdio)  │  (工具提供方)  │
└─────────────┘                       └──────┬───────┘
                                             │
                                     ┌───────┴────────┐
                                     │  外部数据/API   │
                                     │  GitHub/Weather │
                                     │  Calendar/DB    │
                                     └────────────────┘
```

MCP Server 对外暴露三种核心能力：
- **Tools**：可被 AI 调用的函数（如查天气、创建 Issue）
- **Resources**：可被 AI 读取的数据（如文件内容、数据库记录）
- **Prompts**：预定义的提示词模板

## 三、你的项目 MCP 模块分析

### 3.1 整体架构

```
apps/server/src/mcp/
├── mcp.module.ts              # NestJS 模块入口
├── controllers/               # HTTP 端点
│   ├── mcp.controller.ts      # 核心 MCP 端点 (POST/GET/DELETE /api/mcp)
│   ├── mcp-github.controller.ts   # GitHub MCP 代理端点
│   ├── mcp-web-search.controller.ts
│   └── mcp-servers.controller.ts  # MCP Server 管理（安装/卸载/配置）
├── services/
│   ├── mcp.service.ts         # 核心服务：MCP Server 初始化 + Tool 注册
│   ├── mcp-servers.service.ts # 远端 MCP Server 管理
│   ├── mcp-request-context.service.ts
│   └── mcp-session-auth.service.ts
├── tools/                     # 具体工具实现
│   ├── weather.tools.ts       # 天气查询
│   ├── calendar.tools.ts      # 日历 CRUD
│   ├── todo.tools.ts          # 待办 CRUD
│   └── user.tools.ts          # 用户信息
├── schemas/                   # Zod schema（输入校验）
├── catalog/                   # 能力目录（内置 + 远端）
├── oauth/                     # OAuth 2.0 认证
├── types/                     # 类型定义
└── dto/                       # NestJS DTO
```

### 3.2 是否是标准 MCP Server？— 是

你的项目是一个**标准的 Streamable HTTP MCP Server**，依据：

1. **使用官方 SDK**：`@modelcontextprotocol/sdk`（`mcp.types.ts:1` 引用了 `McpServer`）
2. **JSON-RPC 2.0 协议**：所有请求/响应遵循 `jsonrpc: '2.0'` 格式
3. **标准 MCP 方法**：
   - `initialize` — 握手（`mcp.controller.ts:86`）
   - `notifications/initialized` — 初始化完成通知
   - `tools/list` — 列出可用工具（`mcp.controller.ts:316`）
   - `tools/call` — 调用工具
4. **Streamable HTTP Transport**：使用 `StreamableHTTPServerTransport`（`mcp.controller.ts:27`）
5. **Session 管理**：`mcp-session-id` header + UUID 生成器
6. **OAuth 2.0 + PKCE**：完整的 OAuth 认证流程（`oauth/` 目录）

### 3.3 注册的 Tools

| Tool 名称 | 功能 | Schema |
|-----------|------|--------|
| `get_weather` | 查天气（温度/空气质量/穿衣建议） | `GetWeatherSchema` |
| `get_air_quality` | 查空气质量 | `GetAirQualitySchema` |
| `list_events` | 列出日程 | `ListEventsSchema` |
| `create_event` | 创建日程 | `CreateEventSchema` |
| `update_event` | 更新日程 | `UpdateEventSchema` |
| `delete_event` | 删除日程 | `DeleteEventSchema` |
| `list_todos` | 列出待办 | `ListTodosSchema` |
| `create_todo` | 创建待办 | `CreateTodoSchema` |
| `update_todo` | 更新待办 | `UpdateTodoSchema` |
| `delete_todo` | 删除待办 | `DeleteTodoSchema` |
| `get_user_info` | 获取用户信息 | `GetUserInfoSchema` |

另外 GitHub Controller 手动实现了：`get_repo`、`list_issues`、`create_issue`、`list_prs`、`create_pr`

### 3.4 认证机制（OAuth 2.0）

```
Client (Cursor)                    Your Server
     │                                  │
     │  1. POST /api/mcp/oauth/register │
     │  ──────────────────────────────► │  客户端注册
     │                                  │
     │  2. GET /api/mcp/oauth/authorize │
     │  ──────────────────────────────► │  重定向到博客登录页
     │  ◄──── 302 → /mcp/login         │
     │                                  │
     │  3. POST /api/mcp/oauth/approve  │
     │  ──────────────────────────────► │  用户授权，签发 code
     │                                  │
     │  4. POST /api/mcp/oauth/token    │
     │  ──────────────────────────────► │  code 换 access_token
     │  ◄── access_token + refresh_token│
     │                                  │
     │  5. POST /api/mcp               │
     │  Authorization: Bearer <token>   │
     │  ──────────────────────────────► │  MCP JSON-RPC 调用
```

关键安全特性：
- **PKCE (S256)**：防止授权码拦截攻击
- **WWW-Authenticate 挑战**：未认证时返回 401 + OAuth 元数据地址
- **双令牌校验**：区分 `access` 和 `refresh` token，MCP 只接受 access

### 3.5 能力目录（Capability Catalog）

`catalog/` 目录定义了一个**混合式能力市场**：

```typescript
// 内置能力 — 直接运行在本服务
{ kind: 'builtin', id: 'weather', matchTool: ... }

// 远端能力 — 连接外部 MCP Server
{ kind: 'remote', id: 'github', tools: ['get_repo', 'create_issue', ...] }
```

`MCPServersController` 提供了完整的 MCP Server 生命周期管理：
- 安装远端 MCP Server（`POST /mcp-servers/install`）
- 同步远端工具列表（`POST /mcp-servers/:id/sync-tools`）
- 测试连接（`POST /mcp-servers/:id/test-connection`）
- 诊断连接（`POST /mcp-servers/:id/diagnose`）
- 卸载（`DELETE /mcp-servers/:id`）

## 四、面试回答模板

### Q: 你项目里的 MCP 是什么？

> 我在博客系统里实现了一个标准的 MCP Server，基于 `@modelcontextprotocol/sdk` 和 NestJS。
> 它让 AI 客户端（如 Cursor、Claude Desktop）能够直接调用我博客的能力——比如查天气、管理日程和待办、操作 GitHub。
> 认证走的是 OAuth 2.0 + PKCE 流程，和博客本身的用户体系打通。

### Q: MCP 和普通 API 有什么区别？

> 普通 API 是给人调的，返回 HTML 或 JSON。MCP 是给 AI 调的，返回的是**结构化的工具描述**。
> AI 在调用前会先问 MCP Server「你有哪些工具？」（`tools/list`），拿到每个工具的名称、描述、参数 schema，然后自主决定调哪个、传什么参数。
> 这就像函数的「自描述」——AI 不需要预知你的 API 长什么样。

### Q: 大模型是怎么识别意图并调用工具的？

> 大模型没有独立的"意图识别模块"。它的工作方式是：
> 1. 把工具描述（名称、功能、参数 schema）注入 system prompt
> 2. 用户提问时，模型基于描述做语义匹配，判断该调哪个工具
> 3. 输出结构化的 tool_calls（不是自然语言），包含工具名和参数
> 4. 宿主应用转发给 MCP Server 执行
> 5. 工具结果回注 prompt，模型再生成最终回答
>
> 本质上是 LLM 的条件生成能力——模型在训练时就学会了「用户问天气→输出 get_weather 调用」这种映射。
> 工具描述的质量直接决定匹配准确率，所以 schema 设计很重要。

### Q: 你的 MCP Server 有什么亮点？

> 1. **混合架构**：内置工具（天气/日历/待办）+ 远端 MCP Server 市场（GitHub/Slack），用户可以像装插件一样扩展 AI 的能力
> 2. **完整 OAuth**：不是简单的 API Key，而是标准的 OAuth 2.0 Authorization Code + PKCE 流程，支持 `.well-known/oauth-authorization-server` 元数据发现
> 3. **连接诊断**：为远端 MCP Server 提供 `diagnose` 端点，分步检查连接问题

### Q: 为什么用 Streamable HTTP 而不是 stdio/SSE？

> `StreamableHTTPServerTransport` 是 MCP 规范推荐的 HTTP 传输方式，适合服务端部署场景。
> `stdio` 适合本地进程通信，不适合远程；旧的 SSE 方式正在被 Streamable HTTP 取代，后者支持双向流、session 管理，且更易于负载均衡。

## 五、大模型意图识别与 Function Calling 原理

### 5.1 大模型没有"意图识别模块"

大模型**不是**通过一个独立的分类器来判断意图。它的工作方式是：

1. 把所有可用工具的描述（名称、功能、参数 schema）**拼进 system prompt**
2. 用户输入进来后，模型做**语义匹配**——它认为哪个工具的描述最能解决用户的问题
3. 如果匹配到工具，模型输出一个**结构化的 tool call**（而非自然语言）
4. 宿主应用拿到 tool call，转发给 MCP Server 执行
5. 工具返回结果回注 prompt，模型基于结果生成最终回答

本质上，这是 LLM 的**条件生成能力**——模型在训练时就学会了「当用户问天气时，应该输出 `get_weather` 这样的调用格式」。

### 5.2 完整调用流程（以"北京今天天气怎么样"为例）

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: 初始化阶段                                      │
│                                                         │
│  MCP Client ──tools/list──► MCP Server                  │
│  ◄── 返回工具列表（name + description + inputSchema）──   │
│                                                         │
│  Client 把工具描述注入 LLM 的 system prompt：              │
│  "你可以使用以下工具：                                     │
│   - get_weather: 获取天气信息                             │
│     参数: city(string,必填), date(string,可选)"           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Step 2: 用户提问                                       │
│                                                         │
│  用户: "北京今天天气怎么样"                                │
│                                                         │
│  LLM 推理过程：                                          │
│  1. 读取 tool 描述列表                                   │
│  2. 语义匹配 → get_weather 最合适                         │
│  3. 提取参数 → city="北京", date="今天"                   │
│  4. 输出 tool_call（不是自然语言）                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Step 3: LLM 输出 tool_call                              │
│                                                         │
│  {                                                      │
│    "role": "assistant",                                 │
│    "content": null,                                     │
│    "tool_calls": [{                                     │
│      "id": "call_123",                                  │
│      "type": "function",                                │
│      "function": {                                      │
│        "name": "get_weather",                           │
│        "arguments": "{\"city\":\"北京\",\"date\":\"今天\"}"│
│      }                                                  │
│    }]                                                   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Step 4: 宿主应用转发给 MCP Server                       │
│                                                         │
│  POST /api/mcp                                          │
│  {                                                      │
│    "jsonrpc": "2.0",                                    │
│    "id": 1,                                             │
│    "method": "tools/call",                              │
│    "params": {                                          │
│      "name": "get_weather",                             │
│      "arguments": {"city": "北京", "date": "今天"}       │
│    }                                                    │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Step 5: MCP Server 执行工具                             │
│                                                         │
│  McpService.callTool("get_weather", {city: "北京"})     │
│    → weatherTools.getWeather()                          │
│    → 调用和风天气 API                                     │
│    → 返回结构化数据                                       │
│                                                         │
│  响应:                                                   │
│  {                                                      │
│    "jsonrpc": "2.0",                                    │
│    "id": 1,                                             │
│    "result": {                                          │
│      "content": [{                                      │
│        "type": "text",                                  │
│        "text": "北京今日天气：晴，28°C..."                │
│      }],                                                │
│      "structuredContent": {                             │
│        "city": "北京", "temperature": 28, ...            │
│      }                                                  │
│    }                                                    │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Step 6: 结果回注 prompt，模型生成最终回答                  │
│                                                         │
│  对话历史更新为：                                          │
│  [user] 北京今天天气怎么样                                 │
│  [assistant] tool_call: get_weather(city="北京")         │
│  [tool] 北京今日天气：晴，28°C，空气质量良好...            │
│                                                         │
│  LLM 再次推理（这次有 tool result）：                      │
│  "北京今天天气晴朗，气温 28°C，空气质量良好，适合外出。"   │
└─────────────────────────────────────────────────────────┘
```

### 5.3 意图识别的关键：工具描述的质量

模型的"意图识别"能力**完全依赖工具描述的质量**：

```typescript
// 好的描述 — 模型能准确匹配
{
  name: "get_weather",
  description: "获取指定城市的实时天气信息，包括温度、湿度、风速、天气状况",
  inputSchema: {
    type: "object",
    properties: {
      city: { type: "string", description: "城市名称，如'北京'、'上海'" },
      date: { type: "string", description: "查询日期，格式 YYYY-MM-DD，默认今天" }
    },
    required: ["city"]
  }
}

// 差的描述 — 模型可能匹配不到或参数传错
{
  name: "gw",
  description: "天气",
  inputSchema: { type: "object", properties: { c: { type: "string" } } }
}
```

你的项目在这方面做得不错——用 Zod schema 生成结构化的 inputSchema，且每个工具有清晰的中文 title 和 description。

### 5.4 你的实现是否标准？— 是

对照 MCP 规范，你的交互完全标准：

| MCP 规范要求 | 你的实现 | 文件位置 |
|-------------|---------|---------|
| `tools/list` 返回 name + description + inputSchema | ✅ `McpController.listTools()` | `mcp.controller.ts:316` |
| `tools/call` 接收 name + arguments，返回 content | ✅ `McpService.callTool()` | `mcp.service.ts:148` |
| Tool 描述使用 JSON Schema | ✅ Zod schema → JSON Schema | `schemas/*.ts` |
| 返回结构化 content（text 类型） | ✅ `{ type: 'text', text: '...' }` | `weather.tools.ts:30` |
| 返回 structuredContent（可选） | ✅ 天气工具返回了结构化数据 | `weather.tools.ts:53` |
| `initialize` 握手 | ✅ 重连 transport | `mcp.controller.ts:86` |
| Streamable HTTP Transport | ✅ `StreamableHTTPServerTransport` | `mcp.controller.ts:27` |
| Session ID 管理 | ✅ UUID 生成 + header 传递 | `mcp.controller.ts:58` |

唯一需注意：`structuredContent` 不是 MCP 规范标准字段，是你的增强实现，不影响兼容性。

## 六、MCP 协议核心概念速查

| 概念 | 说明 |
|------|------|
| **JSON-RPC 2.0** | MCP 的传输层协议，所有消息格式统一 |
| **Tools** | Server 暴露给 AI 的可调用函数 |
| **Resources** | Server 暴露给 AI 的可读取数据 |
| **Prompts** | Server 提供的预定义提示词模板 |
| **Sampling** | AI 请求 Server 端做一次 LLM 推理（反向调用） |
| **Roots** | Client 告诉 Server 自己能访问哪些文件系统路径 |
| **Transport** | 通信方式：stdio / Streamable HTTP / SSE |
| **Session** | 一次 MCP 连接的生命周期，有唯一 `mcp-session-id` |
| **Tool Call** | LLM 输出的结构化调用请求，包含工具名和参数 |
| **Tool Result** | 工具执行后返回的结果，回注 prompt 让模型生成回答 |
