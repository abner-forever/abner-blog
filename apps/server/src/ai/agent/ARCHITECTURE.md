# AI Agent LangGraph 工作流架构

## 概述

将现有的 if-else 编排 + 独立 LangGraph 意图识别的架构，重构为 **LangGraph Agent Loop** 驱动的完整工作流。

### 重构目标

1. **去掉 God Class** — `AIService` 不再承担编排职责
2. **去掉 if-else 路由** — 所有工具路由由 LLM 自主决定（tool calling）
3. **废弃独立意图检测** — 意图识别融入 Agent Loop，LLM 调用工具的行为本身就是"意图"
4. **引入 Tool-Use Loop** — LLM 可多次调用工具，实现多步推理
5. **动态 MCP 工具注入** — 每个用户看到不同的工具集
6. **EventBus 流式输出** — 在 LangGraph async 模型中实现实时 SSE

## 目录结构

```
apps/server/src/ai/agent/
├── ARCHITECTURE.md              # 本文档
├── agent.module.ts              # NestJS Module
├── agent.processor.ts           # 主入口：接收请求 → 运行 Workflow → EventBus → SSE
│
├── workflow/
│   ├── state.ts                 # AgentState 类型定义（含 MessagesReducer）
│   ├── workflow.ts              # LangGraph StateGraph 定义 + 条件边
│   └── nodes/
│       ├── preprocess.node.ts       # KB 查询、历史加载、MCP 工具注入
│       ├── agent.node.ts            # LLM 推理 + Tool Calling
│       ├── stream-emitter.node.ts   # EventBus → SSE 输出
│
├── tools/
│   ├── index.ts                     # combineTools() 合并 built-in + MCP
│   ├── built-in/
│   │   └── search-knowledge.tool.ts # 知识库检索（唯一内置工具）
│   └── mcp/
│       └── mcp-tool-factory.ts      # 根据用户配置动态生成 MCP Tool 列表
│
├── event-bus/
│   └── agent-event-bus.ts           # EventEmitter 实现：实时 emit SSE events
│
└── validation/
    └── tool-result-validator.ts     # 检查工具结果质量，决定是否重试/降级
```

## AgentState 定义

```typescript
interface AgentState {
  // === 输入 ===
  userInput: string;
  userId: number;
  sessionId: string;
  hasImages: boolean;

  // === 配置 ===
  llm: UniversalChatLLM;
  tools: DynamicTool[];
  systemPrompt: string;

  // === Preprocessing 结果 ===
  knowledgeContext: string | null;
  webSearchContext: string | null;

  // === Agent Loop (LangGraph MessagesReducer 自动管理) ===
  messages: BaseMessage[];

  // === 控制流 ===
  isDone: boolean;

  // === SSE 事件 (EventBus) ===
  streamChannel: AgentEventBus;

  // === 容错 ===
  errors: string[];
  retryCount: number;
}
```

## 工作流节点

```
START → PREPROCESS → AGENT →┐
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
             TOOL_NODE          MCP_NODE
              (内置工具)        (动态注入)
                    │                 │
                    └────────┬────────┘
                             ▼
                    TOOL_RESULT_VALIDATOR
                             │
                    ┌────────┘
                    ▼
                  AGENT (循环)
                    │
                    ▼ (无 tool_calls)
                 OUTPUT → END
```

## 工具定义（中粒度）

|工具|参数|实现|说明|
|---|---|---|---|
|`search_knowledge`|`{query}`|KnowledgeBaseService|唯一内置工具，知识库检索|
|`mcp_*` (动态)|由 MCP Server 定义|MCPServersService|根据用户启用的 MCP 服务器动态生成|

### MCP 工具（由 MCP 服务器提供）

- `search` — 联网搜索
- `create_todo` / `update_todo` / `delete_todo` / `list_todos` — 待办事项管理
- `create_event` / `update_event` / `delete_event` / `list_events` — 日程事件管理
- `get_weather` / `get_air_quality` — 天气查询
- `get_user_info` — 用户信息
- `list_issues` / `list_prs` / `get_repo` / `create_issue` / `create_pr` — GitHub 集成
- `get_page_content` — 网页内容获取

## SSE 协议扩展

新增事件：
- `tool_call_start` — `{ toolName, args }`
- `tool_call_result` — `{ toolName, duration, status }`
- `tool_call_error` — `{ toolName, error, fallbackUsed }`
- `preprocess_done` — `{ hasKnowledge, hasWebSearch }`
- `agent_thinking` — `{ thought }`

保留现有：`thinking_delta`, `chat_delta`, `web_search_status`, `done`, `error`

## 优雅降级策略

工具执行策略：
- **内置工具**：`search_knowledge` 直接调用 KnowledgeBaseService
- **MCP 工具**：由 `mcp-tool-factory.ts` 根据用户启用的 MCP 服务器动态生成
- **无 MCP 服务器**：用户未配置 MCP 服务器时，只有 `search_knowledge` 可用

ToolResultValidator Node 检查结果质量，驱动重试逻辑。
