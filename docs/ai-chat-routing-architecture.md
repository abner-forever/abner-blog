# AI 聊天路由架构

## 概述

AI 聊天后端采用**手工实现的命令模式路由**，核心编排位于 `apps/server/src/ai/ai.service.ts`，通过 `AsyncGenerator` 流式输出 SSE 事件驱动前端渲染。

**意图检测使用 LangGraph 状态机**（`apps/server/src/ai/langgraph/intent-graph.ts`），将前置条件检查、规则匹配和 LLM 兜底三者组织为 4 节点的显式图结构。其余路由逻辑（MCP 工具、联网搜索、知识库 RAG、Skills 注入、LLM 最终调用）仍为手工编排的逐层决策树。

## 核心文件结构

```
apps/server/src/ai/
├── ai.module.ts                          # NestJS 模块定义
├── ai.controller.ts                      # REST 控制器（POST /ai/chat, /ai/chat/stream）
├── ai.service.ts                         # 核心编排器——整个路由决策树
├── ai-session.controller.ts              # 会话 CRUD
├── ai-config.module.ts                   # 用户 AI 配置模块
├── constants.ts                          # 常量
├── dto/
│   ├── chat.dto.ts                       # 请求 DTO
│   ├── extraction-result.dto.ts          # IntentType 枚举 + 响应 DTO
│   ├── ai-config.response.dto.ts
│   └── chat-session.dto.ts
├── langchain/
│   ├── model.ts                          # UniversalChatLLM——6 个 LLM 提供者的统一封装
│   ├── intent.ts                         # 意图检测入口 → 委托给 LangGraph 图
│   ├── chains.ts                         # 桶导出
│   ├── prompts.ts                        # 所有 LLM 提示模板
│   ├── parsers.ts                        # 解析工具
│   └── extractors/
│       ├── event.ts                      # 日历事件实体提取
│       ├── todo.ts                       # 待办实体提取
│       └── weather.ts                    # 天气查询上下文提取
├── langgraph/
│   └── intent-graph.ts                   # LangGraph 意图检测状态机（4 节点）
├── services/
│   ├── ai-command.service.ts             # 待办/日程 CRUD（MCP 或本地）
│   ├── ai-chat-response.service.ts       # Prompt 构建、快速路径、回复规范化
│   ├── ai-chat-session.service.ts        # 会话内消息历史管理
│   ├── ai-config.service.ts              # 用户 AI 配置持久化
│   ├── ai-weather.service.ts             # 天气查询构建
│   └── chat-session-crud.service.ts      # 会话数据库持久化
└── utils/
    ├── web-search-mcp-trigger.ts         # 联网搜索触发判定规则
    ├── build-chat-human-message.ts       # 构建 HumanMessage
    ├── chat-history.ts                   # 意图结果 → 历史记录
    ├── chat-images.ts                    # 图片处理
    ├── github-chat.ts                    # GitHub 仓库/Issue 提取
    ├── think-tag-split.ts                # 推理标签处理（think tag）
    ├── text.ts                           # 文本分块
    ├── minimax-embeddings.ts             # MiniMax 向量嵌入
    ├── response-builders.ts              # 澄清响应构建
    ├── date-range.ts                     # 日期范围计算
    └── llm-user-facing-error.ts          # LLM 错误 → 用户友好提示
```

**关联的外部模块：**

| 模块 | 路径 | 作用 |
|------|------|------|
| MCP | `apps/server/src/mcp/` | MCP 协议服务器/客户端（内置 + 远程工具） |
| WebSearch | `apps/server/src/web-search/` | Tavily / Brave 联网搜索集成 |
| KnowledgeBase | `apps/server/src/knowledge-base/` | MiniMax 嵌入 + ChromaDB 向量 RAG 搜索 |
| Skills | `apps/server/src/skills/` | 可插拔技能系统 |

## 路由决策树（共 5 层）

### 第 0 层：前置条件 + 意图检测（LangGraph 状态机）

文件：`apps/server/src/ai/langgraph/intent-graph.ts` + `apps/server/src/ai/langchain/intent.ts`

意图检测使用 **LangGraph 4 节点状态机**，取代了原手工 if/else 逻辑：

```text
  START → checkPreconditions
    │
    ├─ fast path → resolveIntent (CHAT) → END
    │   （游客 / 带图片 / 快速路径匹配）
    │
    └─ normal → ruleBasedDetection
                  │
                  └─ llmDetection（始终执行）
                        │
                        resolveIntent（LLM > 规则 > CHAT）
                        │
                        END
```

**节点 1：`checkPreconditions`** — `shouldUseFastPath()` + 游客 + 图片判定

| 条件 | 结果 |
|------|------|
| `!userId`（游客/未登录） | fast path → CHAT |
| `hasImages`（带图片） | fast path → CHAT |
| `shouldUseFastPath(message)` 返回 true | fast path → CHAT |
| 以上均否 | 走正常意图检测 |

快速路径判定函数 `shouldUseFastPath()`（`ai-chat-response.service.ts` 第 30 行）：
- 先排除：若含待办/日程/天气/联网搜索关键词 → 不走快速路径
- 再匹配：是否含 `你是`、`帮我`、`解释`、`是什么`、`为什么`、`你好`、`react` 等典型聊天/问答模式

**节点 2：`ruleBasedDetection`** — 正则规则优先

文件：`intent-graph.ts` 第 100 行 `detectIntentByRules()`

通过正则表达式扫描消息，返回意图标签 + 置信度 + 匹配规则名：

| 模式 | 意图 | 最低置信度 |
|------|------|-----------|
| `查一下.*待办/查看.*日程` | QUERY_SCHEDULE | 0.72 |
| `^(我的)?今天的?(待办\|日程)$` | QUERY_SCHEDULE | 0.92 |
| 含天气关键词 | QUERY_WEATHER | 0.76 |
| 删除关键词 + 日程/时间 | DELETE_EVENT | 0.88-0.9 |
| 修改关键词 + 待办/日程 | UPDATE_TODO / UPDATE_EVENT | 0.88-0.9 |
| 创建关键词 + 待办/日程 | CREATE_TODO / CREATE_EVENT | 0.86-0.87 |

**节点 3：`llmDetection`** — LLM 兜底

当规则未返回结果或置信度不足时，向 LLM 发起意图分类：

```typescript
const prompt = `${INTENT_PROMPT}\n\n用户输入：${userInput}`;
const result = await llm.invoke([
  new SystemMessage('你是一个任务管理助手。'),
  new HumanMessage(prompt),
]);
```

LLM 提示模板见 `prompts.ts` 第 1-57 行，要求严格输出 9 种标签之一。

**节点 4：`resolveIntent`** — 综合裁决

优先级：`LLM 匹配结果 > 规则匹配结果 > CHAT 兜底`

### 第 2 层：非 CHAT 意图 → 待办/日程/天气 CRUD

文件：`ai.service.ts` 第 1021 行 `processByIntent()`

```typescript
switch (intent) {
  case CREATE_TODO:  return handleCreateTodo(llm, message, userId);
  case CREATE_EVENT: return handleCreateEvent(llm, message, userId, currentDate);
  case UPDATE_TODO:  return handleUpdateTodo(message, userId);
  case UPDATE_EVENT: return handleUpdateEvent(llm, message, userId, currentDate);
  case DELETE_TODO:  return handleDeleteTodo(message, userId);
  case DELETE_EVENT: return handleDeleteEvent(llm, message, userId, currentDate);
  case QUERY_SCHEDULE: return handleQuerySchedule(llm, userId);
  case QUERY_WEATHER:  return handleQueryWeather(llm, message, userId, currentDate, sessionId);
}
```

全部委托给 `AICommandService` 或 `AIWeatherService`。其中 `AICommandService` 内部对每个操作都支持：

1. **优先 MCP 调用** — 调 `MCPServersService.callToolForUser(userId, toolName, params)`
2. **失败回退** — 直接调本地 NestJS 服务（CalendarService / TodosService）

### 第 3 层：CHAT 意图 → MCP 工具拦截

当意图为 `CHAT` 时，进入 `streamChatOrSearchIntent()`（第 394 行），**先尝试 MCP 工具**：

```
注：旧意图检测 + MCP 工具拦截流程已由 AgentProcessor（LangGraph Agent Workflow）替代。
Agent 工作流自动注册所有可用工具（含 MCP），由 LLM 按需调用，不再依赖 useMcpTools 开关。

### 第 4 层：联网搜索触发

文件：`apps/server/src/ai/utils/web-search-mcp-trigger.ts`

`shouldOfferWebSearchMcp(message)` 规则判定：

| 检测项 | 触发条件 | 示例 |
|--------|---------|------|
| 明确搜索词 | 含"搜索/联网查/web search"等 | "帮我联网搜下..." |
| 新闻资讯 | 含"新闻/热点/头条/快讯"等 | "今天有什么热点新闻" |
| 体育赛事 | 含"比分/赛程/NBA/世界杯"等 | "湖人今天比赛结果" |
| 时间+信息组合 | "明天/今天/这周" + "谁/哪队/比分" | "明天谁和谁踢"（且不包含待办/天气词） |
| 宽松搜索动词 | 含"搜一下/查一下网上/百度一下"等 | "帮我搜一下..."（且不包含待办/天气词） |

触发后执行搜索（由 AgentProcessor Preprocess Node 处理）：

```
Preprocess Node
├── 优先调 MCP search 工具
│   ├── 成功 → 返回摘要文本
│   └── 失败 → 回退到直连 API
│
└── 调 WebSearchService.searchDigest(query) → 返回摘要文本
```

搜索结果通过 `buildWebSearchChatPrompt()` 构建增强提示，严格要求 LLM"基于检索摘要作答，不要使用摘要中不存在的事实"。

### 第 5 层：知识库 RAG 搜索

当没有联网搜索结果时，走 `buildKnowledgeBaseContext()`（第 106 行）：

```typescript
private async buildKnowledgeBaseContext(message: string, userId: number | undefined): Promise<string> {
  if (!userId) return '';
  const results = await this.knowledgeBaseService.search({ query: message, topK: 3 }, userId);
  // 将结果拼装为上下文：
  // [知识库1] xxx
  // [知识库2] xxx
  // [知识库3] xxx
  ...
}
```

- 技术栈：MiniMax Embeddings + ChromaDB 向量数据库
- 仅**已登录用户**可用
- 取**前 3 条**语义最相关的结果
- 搜索结果为空或异常时不阻塞，静默返回空字符串

### 第 6 层：Skills 注入

文件：`skills.service.ts` 第 424 行 `buildSystemPromptForChat()`

技能路由逻辑：

```
buildSystemPromptForChat(userId, skillId?, userMessage?)
├── 指定了 skillId → 只注入该技能（必须是 ACTIVE 状态）
│
└── 未指定 skillId → 查数据库获取用户所有 ACTIVE 技能
    ├── 0 个活跃技能 → 返回 null（不注入）
    ├── 1 个活跃技能 → 注入该技能完整定义（名称、描述、工作流说明）
    ├── 2-3 个活跃技能 → 合并注入所有技能定义
    └── ≥4 个活跃技能 → 用 MiniMax Embeddings 向量匹配用户消息语义，选 topK 相关技能注入
```

技能作为 `SystemMessage` 注入 LLM 上下文，LLM 会看到技能的角色设定和工作流指令。

预置市场技能：

| ID | 名称 | 用途 |
|----|------|------|
| `code-reviewer` | Code Reviewer | 代码审查助手 |
| `travel-planner` | Travel Planner | 旅行规划（天气+日历） |
| `research-assistant` | Research Assistant | 联网搜索生成报告 |
| `blog-publish-assistant` | Blog Publish Assistant | 博客草稿 → 一键发布数据块 |
| `blog-direction-writer` | Blog Direction Writer | 给定方向独立成文 |

## 完整流程图

```
用户消息
  │
  ├─ checkPreconditions（LangGraph 节点 1）
  │   ├─ 游客/未登录 ──────────────→ CHAT（resolveIntent）
  │   ├─ 带图片 ───────────────────→ CHAT（resolveIntent）
  │   └─ 快速路径匹配 ──────────────→ CHAT（resolveIntent）
  │
  └─ ruleBasedDetection（LangGraph 节点 2）
       ├─ 规则匹配（正则）
       └─ llmDetection（LangGraph 节点 3 — LLM 兜底）
              │
              resolveIntent（LangGraph 节点 4 — LLM > 规则 > CHAT）
              │
              ├─ create_todo/create_event
              ├─ update_todo/update_event    → AICommandService
              ├─ delete_todo/delete_event         ├── 优先 MCP 调用
              ├─ query_schedule                    └── 回退本地数据库
              │
              ├─ query_weather → 调 MCP get_weather 优先，失败回退内置天气服务
              │
              └─ CHAT → streamChatOrSearchIntent()
                   ├── MCP 工具拦截
                   │   ├── 用户信息查询？→ get_user_info
                   │   └── GitHub 查询？→ create_issue / list_issues / list_prs / get_repo
                   │
                   ├── 联网搜索触发？
                   │   ├── MCP search → Tavily/Brave
                   │   └── 回退 WebSearchService.searchDigest()
                   │
                   ├── 知识库 RAG（仅当无联网结果时）
                   │   └── MiniMax + ChromaDB → top 3
                   │
                   └── Skills 注入（始终尝试）
                       ├── 指定 skillId → 只注入该技能
                       └── 未指定 → 按活跃数和向量语义匹配
                            │
                            └── LLM 最终调用 → 流式输出 SSE 事件
                                 ├── intent           ← 检测到的意图
                                 ├── thinking_delta   ← 推理过程（think tag）
                                 ├── web_search_status ← 搜索进行/完成
                                 ├── chat_delta       ← 流式回复文本
                                 ├── todo_created/event_created 等 ← 操作结果
                                 ├── schedule_query   ← 日程数据+分析
                                 ├── clarification_needed ← 信息缺失
                                 ├── done             ← 流结束
                                 └── error            ← 错误
```

## 架构设计要点

### 设计原则：规则优先，LLM 兜底

意图检测和联网搜索触发都采用两层策略：
1. **基于规则的正则匹配** — 毫秒级，覆盖 80% 常见场景
2. **LLM 判断兜底** — 规则未命中时通过 LLM 推理判断

### LangGraph 状态机优势

意图检测使用 `@langchain/langgraph` v1.2.5 重构为 4 节点状态图：

| 节点 | 职责 | 输入 | 输出 |
|------|------|------|------|
| `checkPreconditions` | 前置条件检查（游客/图片/快速路径） | userInput, userId, hasImages | useFastPath flag |
| `ruleBasedDetection` | 正则规则匹配 | userInput | ruleResult (intent + confidence) |
| `llmDetection` | LLM 意图分类兜底 | userInput | llmIntent |
| `resolveIntent` | 综合裁决（LLM > 规则 > CHAT） | 以上全部 | finalIntent + detectionMethod |

**优势：**
- **显式状态管理** — 每个节点的输入/输出在 State 中明确定义
- **模块化** — 每个节点独立可测，可单独替换或增强
- **可观测性** — 运行时可追踪每个节点的状态变更
- **可扩展** — 添加新节点（如置信度门槛校验、多 LLM 投票）只需加一个节点和一条边
- **条件路由** — `checkPreconditions` 后的条件边替代了手动 if/else 分支

### SSE 事件协议

流式 API 通过 Server-Sent Events 驱动前端实时渲染。`AIStreamEvent` 类型定义了 14 种事件：

| 事件名 | 触发阶段 | 用途 |
|--------|---------|------|
| `intent` | 检测完成 | 告知前端检测到的意图 |
| `thinking_delta` | LLM 流式 | 推理过程实时展示 |
| `web_search_status` | 搜索中/完成 | 前端搜索状态 UI |
| `chat_delta` | LLM 回复 | 打字机效果的文本流 |
| `todo_created` / `event_created` | 操作完成 | 创建结果卡片展示 |
| `todo_updated` / `event_updated` | 操作完成 | 更新结果展示 |
| `todo_deleted` / `event_deleted` | 操作完成 | 删除结果展示 |
| `schedule_query` | 查询完成 | 日程列表+分析数据 |
| `clarification_needed` | 信息不足 | 要求用户补充字段 |
| `done` | 流结束 | 前端关闭流式连接 |
| `error` | 异常 | 错误展示 |

### 多轮对话中的历史管理

- 采用 `AIChatSessionService` 管理会话内消息历史
- `sliceHistoryForContext()` — 取最近偶数条消息，避免从半截 AIMessage 截断
- 意图操作结果通过 `buildIntentMemoryReply()` 写入历史，保证后续 LLM 理解上下文
- 联网搜索的摘要文本写入用户侧历史记录，便于多轮追问时仍携带事实

### 安全与容错

- **游客保护**：非登录用户强制 CHAT 意图，无法访问技能/知识库/待办
- **MCP 容错链**：MCP 不可用时友好提示 → 自动回退本地服务
- **LLM 错误映射**：`mapLlmErrorForUser()` 将底层 API 错误转为用户友好提示
- **流式兜底**：当流式 LLM 返回空 delta 时自动走 `invoke()` 非流式回退

## 与外部模块的关系

```
         ┌─────────────────────────────────────────┐
         │              AIService                   │
         │  (ai.service.ts · 路由编排器)            │
         └──┬──────┬──────┬──────┬──────┬──────┬───┘
            │      │      │      │      │      │
       ┌────┘ ┌───┘ ┌────┘ ┌────┘ ┌────┘ ┌────┘
       ▼      ▼      ▼      ▼      ▼      ▼
   ┌──────┐ ┌────┐ ┌──────┐ ┌────┐ ┌────┐ ┌──────┐
   │MCP   │ │Web │ │Know‑ │ │Sk‑ │ │AI  │ │Uni‑  │
   │Ser‑  │ │Se‑ │ │ledge │ │ills│ │Cmd │ │versal │
   │vices │ │arch│ │Base  │ │Srvc│ │Srvc│ │ChatLLM│
   │      │ │Srvc│ │Srvc  │ │    │ │    │ │      │
   └──────┘ └────┘ └──────┘ └────┘ └────┘ └──────┘
  get_user_info Tavily  ChromaDB  用    TodoSrvc  OpenAI
  get_weather   Brave   MiniMax  户   EventSrvc Anthropic
  create_issue          嵌入      技   CalSrvc   Gemini
  search etc.                    能                       DeepSeek
                                                          Qwen
                                                          MiniMax
```
