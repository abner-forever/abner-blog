/**
 * Agent 工作流状态定义
 *
 * 使用 LangGraph 的 Annotation.Root + MessagesReducer 构建状态图。
 * messages 字段使用 messagesStateReducer 自动管理 tool_calls / tool_results 的追加。
 */

import {
  Annotation,
  AnnotationRoot,
  messagesStateReducer,
} from '@langchain/langgraph';
import { type BaseMessage } from '@langchain/core/messages';
import { type AgentEventBus } from '../event-bus/agent-event-bus';
import type { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';

/** 工具描述 —— 用于动态构建 ToolNode */
export interface ToolConfig {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tool: DynamicStructuredTool<any> | DynamicTool;
}

/**
 * Agent 工作流状态 spec
 */
const agentStateSpec = {
  // ── 输入 ──
  /** 用户原始输入 */
  userInput: Annotation<string>(),
  /** 用户 ID（undefined = 游客） */
  userId: Annotation<number>(),
  /** 会话 ID */
  sessionId: Annotation<string>(),
  /** 是否包含图片 */
  hasImages: Annotation<boolean>(),
  /** 当前日期 ISO 字符串 */
  currentDate: Annotation<string>(),
  /** 请求配置中的上下文窗口大小 */
  contextWindow: Annotation<number>(),
  /** 用户是否开启了联网搜索 */
  enableWebSearch: Annotation<boolean>(),

  // ── 配置（由 Preprocess Node 填充） ──
  /** 构建好的 System Prompt（含 Skills + 基础指令） */
  systemPrompt: Annotation<string>(),
  /** 可用工具列表 */
  tools: Annotation<ToolConfig[]>(),
  /** 可用工具名称集合（快速查找） */
  toolNames: Annotation<string[]>(),

  // ── 预处理结果（Preprocess Node 填充） ──
  /** 知识库检索引用的上下文文本 */
  knowledgeContext: Annotation<string | null>(),
  /** 是否已加载知识库上下文 */
  knowledgeLoaded: Annotation<boolean>(),
  /** 自动 WebSearch 结果（由 WebSearch MCP Trigger 决定） */
  webSearchContext: Annotation<string | null>(),
  /** 是否已执行 WebSearch */
  webSearchDone: Annotation<boolean>(),

  // ── Agent Loop（LangGraph MessagesReducer 自动管理） ──
  /**
   * 消息列表：用户消息 → AI 消息（含 tool_calls） → ToolMessage 自动追加
   * 使用 messagesStateReducer 确保正确的消息类型排列
   */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // ── 控制流 ──
  /** Agent 是否已完成 */
  isDone: Annotation<boolean>(),
  /** 当前重试次数 */
  retryCount: Annotation<number>(),
  /** 最大重试次数 */
  maxRetries: Annotation<number>(),

  // ── 事件总线（SSE 通信） ──
  /** 事件总线引用 */
  streamChannel: Annotation<AgentEventBus>(),

  // ── 容错 ──
  /** 错误收集（reducer 累加） */
  errors: Annotation<string[]>({
    reducer: (left: string[], right: string | string[]) => {
      if (Array.isArray(right)) return left.concat(right);
      return left.concat([right]);
    },
    default: () => [],
  }),
};

/** AgentState Annotation Root 类型 */
export const AgentState: AnnotationRoot<typeof agentStateSpec> =
  Annotation.Root(agentStateSpec);

/** AgentState 运行时类型 */
export type AgentStateType = typeof AgentState.State;

/** 默认最大重试次数 */
export const DEFAULT_MAX_RETRIES = 3;

/** 默认上下文窗口大小 */
export const DEFAULT_CONTEXT_WINDOW = 10;
