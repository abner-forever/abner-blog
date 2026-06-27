/**
 * Agent Node
 *
 * 核心 LLM 推理节点。
 * 将 state.messages 传入 LLM，解析输出：
 * - 如果 LLM 在输出中标记了 TOOL_CALL → 构建带 tool_calls 的 AIMessage
 * - 否则 → 构建带 content 的 AIMessage（直接回答）
 *
 * 通过 messagesStateReducer 自动追加到 state.messages。
 */

import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType } from '../state';
import { getTextContent } from '../../../langchain/parsers';
import type { WorkflowDeps } from '../workflow';
import { Logger } from '@nestjs/common';

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
function tryParseToolCall(text: string): { toolCall: ParsedToolCall | null; cleanText: string } {
  // 格式1：TOOL_CALL ... TOOL_CALL_END 包裹的 JSON
  const block = text.match(/TOOL_CALL\s*\n?({[\s\S]*?})\s*(?:TOOL_CALL_END|$)/);
  if (block) {
    try {
      const parsed = JSON.parse(block[1]);
      if (parsed && typeof parsed.name === 'string' && typeof parsed.args === 'object') {
        return {
          toolCall: { name: parsed.name, args: parsed.args as Record<string, unknown> },
          cleanText: text.replace(block[0], '').trim(),
        };
      }
    } catch {
      // 解析失败，继续尝试下一种格式
    }
  }

  // 格式2：TOOL_CALL: {...} 单行
  const inline = text.match(/TOOL_CALL:\s*({[\s\S]*?})/);
  if (inline) {
    try {
      const parsed = JSON.parse(inline[1]);
      if (parsed && typeof parsed.name === 'string' && typeof parsed.args === 'object') {
        return {
          toolCall: { name: parsed.name, args: parsed.args as Record<string, unknown> },
          cleanText: text.replace(inline[0], '').trim(),
        };
      }
    } catch {
      // ignore
    }
  }

  return { toolCall: null, cleanText: text };
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
          '## 工具调用格式（需要调用工具时使用）',
          '当用户请求需要工具时，输出格式如下：',
          '',
          'TOOL_CALL',
          `{"name": "工具名称", "args": { "参数名": "参数值" }}`,
          'TOOL_CALL_END',
          '',
          '可用工具:',
          toolDescriptions,
          '',
          '如果不需要工具，直接回答。',
        ].join('\n')
      : [
          '工具已执行，请根据结果回答用户。如果需要更多信息，',
          '可以继续调用工具，格式同上。',
          '',
          '可用工具:',
          toolDescriptions,
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
      (m) => !(m instanceof AIMessage && String(m.content).startsWith('你是一个 AI 助手')),
    );

    const fullMessages = [systemMsg, ...nonSystemMsgs];

    // ── 4. 调用 LLM ──
    try {
      const response = await deps.llm.invoke(fullMessages);
      const rawText = getTextContent(response);

      if (!rawText?.trim()) {
        logger.warn('Agent LLM returned empty response');
        return {
          messages: [new AIMessage({ content: '抱歉，我暂时无法回答这个问题。' })],
        };
      }

      // ── 5. 解析工具调用 ──
      const { toolCall, cleanText } = tryParseToolCall(rawText);

      if (toolCall) {
        // 验证工具名
        if (!toolNames.includes(toolCall.name)) {
          logger.warn(`Invalid tool call: "${toolCall.name}"`);
          // 当作普通文本返回（告知用户）
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

      // ── 6. 直接回答 ──
      // 如果有 TOOL_CALL 标记但解析失败，可能是格式问题，返回原始文本
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
        messages: [
          new AIMessage({ content: `抱歉，处理请求时发生了错误。` }),
        ],
      };
    }
  };
}
