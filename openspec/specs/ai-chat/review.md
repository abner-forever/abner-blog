# AI 聊天后端架构审阅与改进计划

> 审阅时间：2026-06-24
> 基于当前主干代码（`apps/server/src/ai/` ~4950 行，21 个文件）

---

## ✅ 现有优点

1. **SSE 协议设计** — 14 种事件类型覆盖了完整的交互状态（thinking、web_search_status、各种 CRUD 结果），前端交互体验好
2. **流式回退** — 流式 LLM 返回空 delta 时自动切 `invoke()` 非流式（`ai.service.ts:562`）
3. **容错链** — MCP 不可用 → 友好提示；MCP 异常 → 自动回退本地服务
4. **游客保护** — 非登录用户强制 CHAT，无法访问知识库/待办
5. **Multi-provider** — `UniversalChatLLM` 封装 6 家 LLM 提供方，调用方无感知
6. **规则优先** — 意图检测的正则规则覆盖 80% 场景，不用每次都调 LLM
7. **LangGraph 集成** — 意图检测已重构为 4 节点状态机

---

## 🔴 P0 — 必须立即修复

### 1. 拆分 `AIService` God Class（1441 行）

`AIService` 单一类负责以下所有职责：

```
  processMessage              — 非流式入口
  processMessageStream        — 流式入口（AsyncGenerator）
  streamChatOrSearchIntent    — CHAT 路由
  streamGeneralChatIntent     — LLM 最终调用 + 流式
  streamWeatherIntent         — 天气流式
  processByIntent             — 9 种意图派发
  buildKnowledgeBaseContext   — KB RAG
  buildSkillSystemMessage     — 技能注入
  buildWeatherResponseViaMcp  — MCP 天气（手动 HTTP 协议）
  tryHandleUserInfoViaMcp     — 用户信息 MCP
  tryHandleGithubChatViaMcp   — GitHub MCP
  resolveWebSearchDigestForUser — 联网搜索
  handleCreate/Update/Delete/Query * 6 — 待办/日程 CRUD 薄包装
  handleChat                  — 普通聊天
  buildLLM                    — LLM 配置解析
  saveUserAIConfig / getUserAIConfig / getConfigTransportPublicKey — 配置管理
  appendIntentResultToHistoryIfNeeded — 历史记录
  sliceHistoryForContext      — 历史切片
```

**方案**：按职责拆分为多个 Service：

| 新 Service | 职责 | 从 `ai.service.ts` 拆出方法 |
|---|---|---|
| `ChatOrchestratorService` | 核心编排，协调各子 Service | `processMessage`, `processMessageStream` |
| `ChatMcpRouterService` | MCP 相关路由 | `tryHandleUserInfoViaMcp`, `tryHandleGithubChatViaMcp`, `buildWeatherResponseViaMcp` |
| `ChatStreamService` | 流式输出相关 | `streamGeneralChatIntent`, `streamWeatherIntent`, `emitChatDeltaChunks` |
| `ChatHistoryService` | 历史管理 | `sliceHistoryForContext`, `appendIntentResultToHistoryIfNeeded` |

**影响**：高。涉及多文件重命名、模块重新注册，但不动外部接口（Controller 不变），可以逐步迁移。

---

### 2. 去掉静态 MCP Session 状态（竞态条件）

`ai.service.ts:69-71`：

```typescript
private static mcpSessionInitialized = false;
private static mcpSessionId: string | null = null;
```

问题：并发请求时，请求 A 检查到 `mcpSessionInitialized = false` 开始初始化，请求 B 同时检查到同样值，两个请求各自发 `initialize`，后者的响应覆盖前者的 `mcpSessionId`。

**方案**：
- 去掉 `static`，每个请求独立初始化和销毁 MCP session
- 或者用 `Map<userId, session>` 管理多 session
- 更好的方案：MCP session 管理封装到 `MCPServersService`，`AIService` 不直接管理 session

**影响**：中。涉及 `buildWeatherResponseViaMcp` 的重写。

---

### 3. 统一 MCP 调用方式（消除手工 HTTP 协议）

`ai.service.ts:814-987` 整个 `buildWeatherResponseViaMcp` 是手写的 MCP HTTP 客户端（~170 行）：

- 手动构造 `jsonrpc` 请求体
- 手动解析 SSE 响应
- 手动管理 sessionId
- 手动处理 `notifications/initialized`

而同文件第 836 行调用 `this.mcpServersService.callToolForUser()` 已经完成了相同工作。同一类里两种方式并存。

**方案**：
- 优先走 `MCPServersService.callToolForUser('get_weather', ...)`，去掉手工 HTTP
- 如果 `MCPServersService` API 不足（比如不支持手动传 city/date），先增强它
- 如果必须保留 HTTP 调用，提取为独立的 `McpHttpClientService`

**影响**：中。需要确保 `MCPServersService.callToolForUser` 支持天气工具调用的所有场景。

---

### 4. 添加外部调用超时控制

大多数外部调用没有设置超时：

| 调用点 | 代码位置 | 建议超时 |
|--------|---------|----------|
| `llm.invoke()` / `llm.invokeStream()` | `ai.service.ts` 多处 | LLM 按 provider 设 30s-120s |
| `knowledgeBaseService.search()` | `ai.service.ts:112` | 5s |
| `webSearchCore.searchDigest()` | `ai.service.ts:1178` | 10s |
| `skillsService.buildSystemPromptForChat()` | `ai.service.ts:145` | 5s |

**方案**：
- 统一用 `AbortController` + `AbortSignal`
- 在 `model.ts` 的 `LLMCallOptions` 里已有 `signal` 支持，但调用方未使用
- 对非 LLM 调用，用 `Promise.race([call, timeout])` 模式
- 或使用 NestJS 的 `TimeoutInterceptor` 在 Controller 层兜底

**影响**：小。主要在调用方加超时参数。

---

## 🟡 P1 — 应尽快修复

### 5. 流式与非流式逻辑复用

`processMessage()` 和 `processMessageStream()` 存在大量重复逻辑：意图检测、MCP 路由、Web search、KB RAG、Skills 注入、历史写入。

修改一个功能需要在两个方法里各改一次。

**方案**：让非流式复用流式：

```typescript
async processMessage(...): Promise<ChatResponseDto> {
  const events: AIStreamEvent[] = [];
  for await (const event of this.processMessageStream(...)) {
    events.push(event);
    if (event.event === 'done' || event.event === 'error') break;
  }
  return this.eventsToResponse(events);
}
```

**影响**：中。需要实现 `eventsToResponse()` 转换逻辑。

### 6. 统一错误处理策略

当前问题：
- `try/catch` 不平衡（`ai.service.ts` 中 17 个 try，12 个 catch）
- 有些 catch 只打 log 就吞掉异常
- 错误映射逻辑散落各处（`mapLlmErrorForUser` 是唯一统一的地方）
- 流式路径中，第 441 行 catch 后 `throw err` 但外层没有统一兜底

**方案**：建立层级化错误处理：

```
Provider 层（model.ts）
  └─ 将 Provider API 错误（HTTP 状态码、格式错误）转为统一 LLMError

Service 层（各 service）
  └─ 捕获业务级异常（MCP 不可用、KB 搜索失败），返回友好提示

Orchestrator 层（ai.service.ts）
  └─ 最外层 try/catch，保证 SSE 'error' 事件总能发出
  └─ processMessageStream 的 try/catch 在第 299 行已存在，但中间层抛出的异常可能绕过
```

**影响**：中。涉及多处代码但主要是重构 catch 逻辑。

### 7. Prompt 模板外置管理

当前所有 prompt 在 `prompts.ts` 里是 TypeScript 模板字面量：

- 修改 prompt 需要代码部署
- 无法做 Prompt 版本对比
- 不支持 A/B 测试
- 同一个 INTENT_PROMPT 无法按用户/场景做差异化

**方案**：
- **短期**：提取为独立 JSON 文件（`prompts.json`），用 `PromptService` 加载并替换变量
- **长期**：存入数据库，通过管理后台编辑，支持版本管理

**影响**：中短期小，长期看是大工程。

---

## 🔵 P2 — 可以优化

### 8. LangGraph 扩展到全路由

当前 LangGraph 只覆盖了意图检测阶段（4 个节点）。剩余路由（MCP 工具 → Web search → KB RAG → Skills → LLM）仍是 `if/else` + `switch` + `AsyncGenerator yield`。

**方案**：把 `streamChatOrSearchIntent` → `streamGeneralChatIntent` 的流程也做进 LangGraph：

```
resolveIntent=CHAT → mcpRouter
  ├─ (userInfo match) → handleUserInfoMCP → END
  ├─ (github match) → handleGithubMCP → END
  └─ (no MCP) → webSearchGate
       ├─ (needs search) → webSearch → LLM Call → END
       └─ (no search) → kbRagGate
            ├─ (has KB) → buildContext
            └─ skillsGate → skillsInject → LLMStreamNode → END
```

每个阶段都是独立 Node，条件边替代 `if/else`。可以实现更复杂的逻辑比如"先 KB 搜索，再用搜索结果增强 LLM 提示"而不用改路由代码。

**影响**：大（3-5 天）。涉及流式输出模式的改变（LangGraph 的 streaming 与当前 SSE yield 模式需要适配）。

### 9. Magic Numbers 抽取配置

| 位置 | 值 | 说明 |
|------|-----|------|
| `ai.service.ts:92` | `maxHistoryMessages = 10` | 历史上下文条数上限 |
| `ai.service.ts:113` | `topK: 3` | KB 检索 topK |
| `intent-graph.ts` | 0.72~0.92 置信度阈值 | 规则匹配置信度 |
| `web-search-mcp-trigger.ts` | 各种 regex | 搜索触发规则 |
| `ai-chat-response.service.ts:30` | fast path 排除/匹配规则 | 快速路径判定 |
| `constants.ts` | 少量常量 | 已有常量文件但使用不充分 |

**方案**：配置集中到 NestJS Config（环境变量 + 数据库配置覆盖），提供管理后台界面调整。至少先把 `magic number` 移到 `constants.ts`。

### 10. Provider API Key 加解密不应在 AIService

`saveUserAIConfig()`（`ai.service.ts:1365`）直接调用 `AIConfigService.decryptConfigTransportApiKeys()`。

**方案**：加解密封装在 `AIConfigService` 内部，对外只暴露 `saveUserConfig(encryptedInput)` 和 `getDecryptedApiKeys(userId)`。AIService 不感知加解密细节。

### 11. 统一日志方式

当前混用三种日志：
- `process.stderr.write()` — 15 处
- `this.logger.log/warn/error` — 20+ 处
- `console.error()` — 1 处（`ai.service.ts:197`）

**方案**：
- 统一使用 NestJS `Logger`，通过 `Logger.setContext()` 区分模块
- `process.stderr.write` 仅在 `AI_CHAT_DEBUG=1` 时使用（已有 `isAiChatDebug()` 检查，但使用不统一）

---

## ⚪ P3 — 锦上添花

### 12. 添加速率限制

无任何速率控制 → 用户连续 100 条消息全部触发 LLM 调用。

**方案**：Controller 层加 `@Throttle()` guard（`@nestjs/throttler`），或 Redis 用户级限流。

### 13. 补齐测试覆盖

`ai.service.spec.ts` 存在但测试覆盖严重不足。拆分服务后每个 Service 独立可测。

**方案**：
- 拆分后为每个新 Service 写单元测试（mock 外部依赖）
- 关键路径写集成测试（意图检测、MCP 路由、流式输出）

---

## 📋 实施路线

| 阶段 | 任务 | 预期工作量 |
|------|------|-----------|
| **Phase 1** | P0-2（去掉 static MCP）+ P0-4（加超时） | 1 天 |
| **Phase 1** | P0-3（统一 MCP 调用） | 1 天 |
| **Phase 2** | P0-1（拆 AIService） | 2-3 天 |
| **Phase 2** | P1-5（流式/非流式复用） | 1 天 |
| **Phase 3** | P1-6（统一错误处理）+ P1-7（Prompt 外置） | 1-2 天 |
| **Phase 3** | P2-8（LangGraph 扩展）+ P2-9（配置抽取） | 3-5 天 |
| **Phase 4** | P2-10（加解密封装）+ P3-11/12/13 | 2 天 |

---

## 结论

当前架构**基础扎实** — SSE 设计、流式回退、容错链、Multi-provider 都是正确选择。但 **1441 行的 God Class** 是最突出的瓶颈，LangGraph 引入是好的第一步。

建议优先解决 P0 的四个问题再动其他，因为 God Class 拆分和 MCP 重构可能改变方法签名，晚动不如早动。
