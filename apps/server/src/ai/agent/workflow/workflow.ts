/**
 * Agent LangGraph Workflow 定义
 *
 * 状态图结构：
 *
 *   START → preprocess → agent
 *                           │
 *                   ┌───────┴────────┐
 *                   ▼                ▼
 *                tools (工具调用)    output (回答)
 *                   │                │
 *                   └──→ agent ──────┘
 *                                    │
 *                                    ▼
 *                                   END
 */

import {
  StateGraph,
  START,
  END,
  CompiledStateGraph,
} from '@langchain/langgraph';
import { AIMessage, ToolMessage } from '@langchain/core/messages';
import { AgentState, type AgentStateType } from './state';
import { createPreprocessNode } from './nodes/preprocess.node';
import { createAgentNode } from './nodes/agent.node';
import { createStreamEmitterNode } from './nodes/stream-emitter.node';
import { validateToolResults } from '../validation/tool-result-validator';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import type { ChatLLM } from '../../langchain/model';
import type { AIChatSessionService } from '../../services/ai-chat-session.service';
import type { ChatHistoryService } from '../../orchestrator/chat-history.service';
import type { AIChatResponseService } from '../../services/ai-chat-response.service';

import type { KnowledgeBaseService } from '../../../knowledge-base/knowledge-base.service';
import type { MCPServersService } from '../../../mcp/services/mcp-servers.service';
import type { SkillsService } from '../../../skills/skills.service';
import type { ChatImageDto } from '../../dto/chat.dto';
import { ChatStreamService } from '../../orchestrator/chat-stream.service';

/** 工作流全部依赖 */
export interface WorkflowDeps {
  // Singleton services
  chatSessionService: AIChatSessionService;
  chatHistoryService: ChatHistoryService;
  chatResponseService: AIChatResponseService;
  knowledgeBaseService: KnowledgeBaseService;
  mcpServersService: MCPServersService;
  skillsService: SkillsService;
  chatStreamService: ChatStreamService;
  // Per-request
  llm: ChatLLM;
  images?: ChatImageDto[];
}

type GraphState = AgentStateType;

/**
 * 工具执行节点
 *
 * 从最后一条 AIMessage 中提取 tool_calls，执行对应工具，返回 ToolMessages。
 */
function createToolExecutionNode(_deps: WorkflowDeps) {
  void _deps;
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const { messages, tools, streamChannel, retryCount, maxRetries } = state;

    const lastMsg = messages[messages.length - 1];
    if (!(lastMsg instanceof AIMessage) || !lastMsg.tool_calls?.length) {
      return {};
    }

    const toolResults: ToolMessage[] = [];
    let newRetryCount = retryCount;

    for (const tc of lastMsg.tool_calls) {
      const toolConfig = tools.find((t) => t.name === tc.name);
      if (!toolConfig) {
        toolResults.push(
          new ToolMessage({
            content: JSON.stringify({
              status: 'error',
              error: `未知工具: ${tc.name}`,
            }),
            tool_call_id: tc.id || 'unknown',
            name: tc.name,
          }),
        );
        continue;
      }

      const startTime = Date.now();
      try {
        const result: unknown = await (
          toolConfig.tool as DynamicStructuredTool
        ).invoke(tc.args);
        const resultStr =
          typeof result === 'string' ? result : JSON.stringify(result);
        const duration = Date.now() - startTime;

        // 验证结果
        const validation = validateToolResults(
          [
            new ToolMessage({
              content: resultStr,
              tool_call_id: tc.id || 'unknown',
              name: tc.name,
            }),
          ],
          retryCount,
          maxRetries,
        )[0];

        if (validation && !validation.valid && validation.shouldRetry) {
          newRetryCount += 1;
          streamChannel.emitToolCallResult(tc.name, duration, 'error');
        } else {
          streamChannel.emitToolCallResult(tc.name, duration, 'success');

          // 发射结构化 SSE 事件（前端富卡片展示）
          emitStructuredToolEvent(streamChannel, tc.name, tc.args, resultStr);
        }

        toolResults.push(
          new ToolMessage({
            content: resultStr,
            tool_call_id: tc.id || 'unknown',
            name: tc.name,
          }),
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        streamChannel.emitToolCallError(tc.name, msg, false);

        toolResults.push(
          new ToolMessage({
            content: JSON.stringify({ status: 'error', error: msg }),
            tool_call_id: tc.id || 'unknown',
            name: tc.name,
          }),
        );
      }
    }

    return { messages: toolResults, retryCount: newRetryCount };
  };
}

/**
 * 工具名称 → 意图名称 映射（MCP 工具动态生成，此处为空）
 */
const TOOL_TO_INTENT: Record<string, Record<string, string>> = {};

/**
 * 从工具结果字符串中提取结构化数据，通过 EventBus 发射对应 SSE 事件。
 *
 * 前端 handleChatStreamEvent 会根据这些事件渲染富卡片（TodoCard、EventCard、ScheduleQueryCard 等）。
 */
function emitStructuredToolEvent(
  streamChannel: import('../event-bus/agent-event-bus').AgentEventBus,
  toolName: string,
  args: Record<string, unknown>,
  resultStr: string,
): void {
  try {
    // 确定意图
    const action = (args?.action as string) || '_';
    const intentMapping = TOOL_TO_INTENT[toolName];
    const intent = intentMapping?.[action];
    if (!intent) return;
    streamChannel.emitIntent(intent);

    // 解析结果
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(resultStr) as Record<string, unknown> | null;
    } catch {
      return; // 非 JSON 结果，不发射结构化事件
    }

    if (parsed?.status !== 'success') return;

    switch (intent) {
      case 'create_todo': {
        const data = (parsed?.data || {}) as Record<string, unknown>;
        streamChannel.emitTodoCreated(data);
        break;
      }
      case 'update_todo': {
        const data = (parsed?.data || {}) as Record<string, unknown>;
        streamChannel.emitTodoUpdated(data);
        break;
      }
      case 'delete_todo': {
        const data = (parsed?.data || {}) as Record<string, unknown>;
        streamChannel.emitTodoDeleted(data);
        break;
      }
      case 'create_event': {
        const data = (parsed?.data || {}) as Record<string, unknown>;
        streamChannel.emitEventCreated(data);
        break;
      }
      case 'update_event': {
        const data = (parsed?.data || {}) as Record<string, unknown>;
        streamChannel.emitEventUpdated(data);
        break;
      }
      case 'delete_event': {
        const data = (parsed?.data || {}) as Record<string, unknown>;
        streamChannel.emitEventDeleted(data);
        break;
      }
      case 'query_schedule': {
        const scheduleData = (parsed?.data || []) as unknown[];
        const analysis = parsed?.analysis as
          | Record<string, unknown>
          | undefined;
        streamChannel.emitScheduleQuery(scheduleData, analysis);
        break;
      }
    }
  } catch {
    // 静默处理：结构化事件发射失败不影响主流程
  }
}

/**
 * 创建编译后的 Agent 工作流图
 */
export function createAgentWorkflow(deps: WorkflowDeps) {
  const preprocessNode = createPreprocessNode(deps);
  const agentNode = createAgentNode(deps);
  const toolExecNode = createToolExecutionNode(deps);
  const streamEmitterNode = createStreamEmitterNode(deps);

  const workflow = new StateGraph(AgentState)
    .addNode('preprocess', preprocessNode)
    .addNode('agent', agentNode)
    .addNode('tool_executor', toolExecNode)
    .addNode('output', streamEmitterNode)
    .addEdge(START, 'preprocess')
    .addEdge('preprocess', 'agent')
    .addEdge('output', END)
    .addConditionalEdges(
      'agent',
      (state: GraphState) => {
        const lastMsg = state.messages[state.messages.length - 1];
        if (lastMsg instanceof AIMessage && lastMsg.tool_calls?.length > 0) {
          return 'tool_executor';
        }
        return 'output';
      },
      { tool_executor: 'tool_executor', output: 'output' },
    )
    .addEdge('tool_executor', 'agent');

  return workflow.compile() as CompiledStateGraph<
    GraphState,
    Partial<GraphState>
  >;
}
