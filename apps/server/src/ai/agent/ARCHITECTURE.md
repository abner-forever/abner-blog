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
│       ├── preprocess.node.ts       # KB 查询、历史加载、权限检查
│       ├── agent.node.ts            # LLM 推理 + Tool Calling
│       ├── tool-executor.node.ts    # 执行 Built-in 工具
│       ├── mcp-executor.node.ts     # 执行动态注入的 MCP 工具
│       ├── tool-validator.node.ts   # 验证结果质量 + 驱动重试
│       └── stream-emitter.node.ts   # EventBus → SSE 输出
│
├── tools/
│   ├── index.ts                     # combineBuiltInTools() + combineMcpTools()
│   ├── built-in/
│   │   ├── manage-todos.tool.ts     # todo CRUD
│   │   ├── manage-events.tool.ts    # calendar CRUD
│   │   ├── query-weather.tool.ts    # 天气查询
│   │   ├── search-web.tool.ts       # 网页搜索
│   │   └── search-knowledge.tool.ts # 知识库检索
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

|工具|参数|实现|Fallback|
|---|---|---|---|
|`manage_todos`|`{action, title?, dueDate?, id?}`|AICommandService|Direct|
|`manage_events`|`{action, title?, startTime?, endTime?}`|AICommandService|Direct|
|`query_weather`|`{city, adm?, date?}`|AIWeatherService|MCP→Direct|
|`search_web`|`{query}`|MCP Search→WebSearchService|MCP→Direct|
|`search_knowledge`|`{query}`|KnowledgeBaseService|-|
|`mcp_*` (动态)|由 MCP Server 定义|MCPServersService|-|

## SSE 协议扩展

新增事件：
- `tool_call_start` — `{ toolName, args }`
- `tool_call_result` — `{ toolName, duration, status }`
- `tool_call_error` — `{ toolName, error, fallbackUsed }`
- `preprocess_done` — `{ hasKnowledge, hasWebSearch }`
- `agent_thinking` — `{ thought }`

保留现有：`thinking_delta`, `chat_delta`, `web_search_status`, `done`, `error`

## 优雅降级策略

每个工具函数内部实现 fallback 链：
```
MCP 优先 → Direct Service fallback → 返回结果/错误说明给 LLM
```

ToolResultValidator Node 额外检查结果质量，驱动重试逻辑。
