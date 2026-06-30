/**
 * Agent Node
 *
 * 核心 LLM 推理节点。
 * 将 state.messages 传入 LLM，解析输出：
 * - ⭐ 优先：LLM 返回原生 tool_calls → 构建带 tool_calls 的 AIMessage
 * - 降级：LLM 文本输出中标记了 TOOL_CALL → 构建带 tool_calls 的 AIMessage
 * - 否则 → 构建带 content 的 AIMessage（直接回答）
 *
 * 通过 messagesStateReducer 自动追加到 state.messages。
 */

import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType, ToolConfig } from '../state';
import { getTextContent } from '../../../langchain/parsers';
import type { WorkflowDeps } from '../workflow';
import { Logger } from '@nestjs/common';
import type { ToolDefinition } from '../../../langchain/model';
import { zodSchemaToJsonSchema } from '../../../langchain/model';
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
        '你是一个 AI 助手，可以使用工具完成用户的请求。',
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

    // ── 4. 构建原生工具定义并调用 LLM ──
    try {
      const toolDefs = buildToolDefinitions(tools);
      const response = await deps.llm.invoke(fullMessages, {
        tools: toolDefs,
      });

      // ── 5. ⭐ 优先：检查原生 tool_calls ──
      if (response.tool_calls && response.tool_calls.length > 0) {
        // 验证工具名
        const validCalls = response.tool_calls.filter((tc) =>
          toolNames.includes(tc.name),
        );

        if (validCalls.length === 0) {
          // 所有工具都不存在 → 当作文本返回
          const rawText =
            typeof response.content === 'string' ? response.content : '';
          return {
            messages: [
              new AIMessage({
                content: rawText || '抱歉，无法完成此操作。',
              }),
            ],
          };
        }

        // 发射 tool_call_start 事件（取第一个工具）
        streamChannel.emitToolCallStart(validCalls[0].name, validCalls[0].args);

        return {
          messages: [
            new AIMessage({
              content: '',
              tool_calls: validCalls.map((tc) => ({
                name: tc.name,
                args: tc.args,
                id:
                  tc.id ||
                  `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                type: 'tool_call' as const,
              })),
            }),
          ],
        };
      }

      // ── 6. 降级：文本 TOOL_CALL 格式解析 ──
      const rawText = getTextContent(response);

      if (!rawText?.trim()) {
        logger.warn('Agent LLM returned empty response');
        return {
          messages: [
            new AIMessage({ content: '抱歉，我暂时无法回答这个问题。' }),
          ],
        };
      }

      const { toolCall } = tryParseToolCall(rawText);

      if (toolCall) {
        // 验证工具名
        if (!toolNames.includes(toolCall.name)) {
          logger.warn(`Invalid tool call: "${toolCall.name}"`);
          return {
            messages: [
              new AIMessage({
                content: rawText + `\n(注意：工具 "${toolCall.name}" 不可用)`,
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

      // ── 7. 直接回答 ──
      if (rawText.includes('TOOL_CALL')) {
        logger.warn('TOOL_CALL marker found but parsing failed');
      }

      return {
        messages: [new AIMessage({ content: rawText })],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`Agent LLM invoke failed: ${msg}`);
      return {
        messages: [new AIMessage({ content: `抱歉，处理请求时发生了错误。` })],
      };
    }
  };
}
