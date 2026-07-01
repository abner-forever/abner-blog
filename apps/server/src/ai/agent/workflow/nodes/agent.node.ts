/**
 * Agent Node
 *
 * 核心 LLM 推理节点，使用流式调用实时发射 SSE。
 * 将 state.messages 传入 LLM，逐 chunk 输出：
 * - ⭐ 流式文本 → 逐 chunk 发射 chat_delta / thinking_delta 到 EventBus
 * - ⭐ 流式工具调用 → 从 chunk 累积 toolCallDelta，构建带 tool_calls 的 AIMessage
 * - 降级：累积文本中 TOOL_CALL 标记 → 构建带 tool_calls 的 AIMessage
 * - 否则 → 构建带 content 的 AIMessage（直接回答）
 *
 * 通过 messagesStateReducer 自动追加到 state.messages。
 * 标记 streamedViaEventBus: true 通知 stream-emitter 跳过重复发射。
 */

import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType, ToolConfig } from '../state';
import type { WorkflowDeps } from '../workflow';
import { Logger } from '@nestjs/common';
import type { ToolDefinition } from '../../../langchain/model';
import {
  zodSchemaToJsonSchema,
  buildModelIdentity,
} from '../../../langchain/model';
import { DynamicStructuredTool, type DynamicTool } from '@langchain/core/tools';

const logger = new Logger('AgentNode');

/** 解析后的工具调用 */
interface ParsedToolCall {
  name: string;
  args: Record<string, unknown>;
}

/**
 * 尝试从 LLM 输出中解析工具调用
 *
 * 支持两种格式：
 * 1. TOOL_CALL\n{"name":"xxx","args":{...}}\nTOOL_CALL_END
 * 2. TOOL_CALL: {"name":"xxx","args":{...}}
 */
function tryParseToolCall(text: string): {
  toolCall: ParsedToolCall | null;
  cleanText: string;
} {
  // 格式1：TOOL_CALL ... TOOL_CALL_END 包裹的 JSON
  const block = text.match(/TOOL_CALL\s*\n?({[\s\S]*?})\s*(?:TOOL_CALL_END|$)/);
  if (block) {
    try {
      const parsed: unknown = JSON.parse(block[1]);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj.name === 'string' && typeof obj.args === 'object') {
          return {
            toolCall: {
              name: obj.name,
              args: obj.args as Record<string, unknown>,
            },
            cleanText: text.replace(block[0], '').trim(),
          };
        }
      }
    } catch {
      // 解析失败，继续尝试下一种格式
    }
  }

  // 格式2：TOOL_CALL: {...} 单行
  const inline = text.match(/TOOL_CALL:\s*({[\s\S]*?})/);
  if (inline) {
    try {
      const parsed: unknown = JSON.parse(inline[1]);
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj.name === 'string' && typeof obj.args === 'object') {
          return {
            toolCall: {
              name: obj.name,
              args: obj.args as Record<string, unknown>,
            },
            cleanText: text.replace(inline[0], '').trim(),
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return { toolCall: null, cleanText: text };
}

/**
 * 将 ToolConfig[] 转换为 OpenAI 兼容的 ToolDefinition[]
 *
 * - DynamicStructuredTool（内置工具）→ 从 Zod schema 提取 JSON Schema
 * - DynamicTool（MCP 工具）→ 创建自由格式的 JSON Schema
 */
function buildToolDefinitions(tools: ToolConfig[]): ToolDefinition[] {
  return tools.map((t) => {
    const tool = t.tool;
    // DynamicStructuredTool 自带 Zod schema
    if (isDynamicStructuredTool(tool)) {
      const schema = tool.schema;
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: schema
            ? zodSchemaToJsonSchema(schema)
            : { type: 'object', properties: {} },
        },
      };
    }
    // DynamicTool（MCP 等）— 自由格式参数，允许 LLM 传递任意属性
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: true,
          description: '工具参数，参考工具描述中的参数说明传递 JSON 键值对',
        },
      },
    };
  });
}

/** 类型守卫：是否是 DynamicStructuredTool（有 Zod schema） */
function isDynamicStructuredTool(
  tool: DynamicStructuredTool | DynamicTool,
): tool is DynamicStructuredTool {
  return tool instanceof DynamicStructuredTool;
}

/**
 * 创建 Agent 节点
 *
 * 使用 invokeStream 实现流式输出：
 * - LLM 文本回复 → 逐 chunk 发射 chat_delta / thinking_delta 到 EventBus
 * - LLM 工具调用 → 从流式 chunk 中累积 toolCallDelta → 构建 AIMessage 带 tool_calls
 * - 文本 TOOL_CALL 标记降级 → 在累积文本中检测
 * - 标记 streamedViaEventBus: true 通知 stream-emitter 跳过重复发射
 */
export function createAgentNode(deps: WorkflowDeps) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const { messages, tools, toolNames, streamChannel } = state;

    // ── 1. 构建 tool descriptor ──
    const toolDescriptions = tools
      .map((t) => {
        const toolInfo = tools.find((x) => x.name === t.name);
        return `- ${t.name}: ${toolInfo?.description || '未知工具'}`;
      })
      .join('\n');

    // 如果不是第一轮（已有工具调用结果），简化 prompt
    const isFirstAgentCall = messages.length <= 2; // systemMsg + userMsg
    const toolInstruction = isFirstAgentCall
      ? [
          '## 工具调用格式',
          '当用户请求需要工具时，使用下方的工具来完成任务。',
          '可用工具:',
          toolDescriptions,
          '',
          '如果不需要工具，直接回答。',
          '',
          '注意：回答用户时，不要提及工具名称或内部调用过程。直接给出答案即可。',
        ].join('\n')
      : [
          '工具已执行，请根据结果回答用户。如果需要更多信息，',
          '可以继续调用工具。',
          '',
          '可用工具:',
          toolDescriptions,
          '',
          '注意：回答时不要提及工具名称或内部机制，直接给出用户想要的信息。',
        ].join('\n');

    // ── 2. 构建 system message ──
    const systemMsg = new AIMessage({
      content: [
        buildModelIdentity(deps.llm.config),
        '',
        toolInstruction,
        '',
        `当前时间: ${new Date().toISOString().split('T')[0]}`,
      ].join('\n'),
    });

    // ── 3. 构建完全的消息列表 ──
    // 移除之前的 system 消息，只保持最新的
    const nonSystemMsgs = messages.filter(
      (m) =>
        !(
          m instanceof AIMessage &&
          typeof m.content === 'string' &&
          m.content.startsWith('你是一个 AI 助手')
        ),
    );

    const fullMessages = [systemMsg, ...nonSystemMsgs];

    // ── 4. 构建原生工具定义并使用流式调用 LLM ──
    try {
      const toolDefs = buildToolDefinitions(tools);

      // 流式累积状态
      let accumulatedContent = '';
      let isToolCall = false;

      // 流式工具调用累积（OpenAI 兼容格式）
      // 第一块含 id + name，后续块只带 args 增量
      let tcId = '';
      let tcName = '';
      let tcArgsAccum = '';

      for await (const chunk of deps.llm.invokeStream(fullMessages, {
        tools: toolDefs,
      })) {
        // 推理增量 → thinking_delta
        if (chunk.reasoningDelta) {
          streamChannel.emit({
            event: 'thinking_delta',
            payload: { delta: chunk.reasoningDelta },
          });
        }

        // 文本增量 → chat_delta + 累积
        if (chunk.answerDelta) {
          accumulatedContent += chunk.answerDelta;
          streamChannel.emit({
            event: 'chat_delta',
            payload: { delta: chunk.answerDelta },
          });
        }

        // 工具调用增量 → 累积 flat 字符串
        if (chunk.toolCallDelta) {
          isToolCall = true;
          if (chunk.toolCallDelta.id) tcId = chunk.toolCallDelta.id;
          if (chunk.toolCallDelta.name) tcName = chunk.toolCallDelta.name;
          if (chunk.toolCallDelta.args) tcArgsAccum += chunk.toolCallDelta.args;
        }

        // 结束原因：工具调用
        if (chunk.finishReason === 'tool_calls') {
          isToolCall = true;
        }
      }

      // ── 5. ⭐ 优先：流中原生 tool_calls ──
      if (isToolCall && tcName) {
        if (toolNames.includes(tcName)) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tcArgsAccum) as Record<string, unknown>;
          } catch {
            logger.warn(
              `Failed to parse tool call args for "${tcName}": ${tcArgsAccum.slice(0, 100)}`,
            );
          }

          streamChannel.emitToolCallStart(tcName, args);

          return {
            messages: [
              new AIMessage({
                content: '',
                tool_calls: [
                  {
                    name: tcName,
                    args,
                    id:
                      tcId ||
                      `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    type: 'tool_call' as const,
                  },
                ],
              }),
            ],
          };
        }

        // 工具不存在 → 当作文本返回
        return {
          messages: [
            new AIMessage({
              content: accumulatedContent || '抱歉，无法完成此操作。',
            }),
          ],
        };
      }

      // ── 6. 降级：文本 TOOL_CALL 格式解析 ──
      if (accumulatedContent.trim()) {
        const { toolCall } = tryParseToolCall(accumulatedContent);

        if (toolCall) {
          if (!toolNames.includes(toolCall.name)) {
            logger.warn(`Invalid tool call: "${toolCall.name}"`);
            return {
              messages: [
                new AIMessage({
                  content:
                    accumulatedContent +
                    `\n(注意：工具 "${toolCall.name}" 不可用)`,
                }),
              ],
            };
          }

          streamChannel.emitToolCallStart(toolCall.name, toolCall.args);

          return {
            messages: [
              new AIMessage({
                content: '',
                tool_calls: [
                  {
                    name: toolCall.name,
                    args: toolCall.args,
                    id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                    type: 'tool_call' as const,
                  },
                ],
              }),
            ],
          };
        }
      }

      // ── 7. 直接回答 ──
      if (accumulatedContent.includes('TOOL_CALL')) {
        logger.warn('TOOL_CALL marker found but parsing failed');
      }

      if (!accumulatedContent.trim()) {
        logger.warn('Agent LLM stream returned empty response');
        return {
          messages: [
            new AIMessage({
              content: '抱歉，我暂时无法回答这个问题。',
            }),
          ],
        };
      }

      return {
        messages: [new AIMessage({ content: accumulatedContent })],
        // 标记文本已通过 EventBus 流式发射，stream-emitter 应跳过重复发射
        streamedViaEventBus: true,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Agent LLM stream failed: ${msg}`);
      return {
        messages: [new AIMessage({ content: `抱歉，处理请求时发生了错误。` })],
      };
    }
  };
}
