/**
 * Stream Emitter Node
 *
 * 最终输出节点：将 AIMessage 内容通过 EventBus 推送给 SSE 响应。
 * 处理 think tag 分割、增量 delta 提取、历史保存。
 */

import { AIMessage } from '@langchain/core/messages';
import type { AgentStateType } from '../state';
import { splitThinkTaggedDelta } from '../../../utils/think-tag-split';
import type { WorkflowDeps } from '../workflow';
import { Logger } from '@nestjs/common';
import type { AgentEvent } from '../../event-bus/agent-event-bus';

const logger = new Logger('StreamEmitterNode');

/**
 * 创建 Stream Emitter 节点
 */
export function createStreamEmitterNode(deps: WorkflowDeps) {
  return (state: AgentStateType): Partial<AgentStateType> => {
    const { messages, streamChannel, userId, sessionId, userInput } = state;

    const lastMsg = messages[messages.length - 1];

    if (!lastMsg || !(lastMsg instanceof AIMessage)) {
      streamChannel.emit({
        event: 'chat_delta',
        payload: { delta: '抱歉，我没有得到有效的回复。' },
      });
      streamChannel.emit({ event: 'done', payload: { type: 'chat' } });
      return { isDone: true };
    }

    const rawContent =
      typeof lastMsg.content === 'string' ? lastMsg.content : '';

    if (!rawContent.trim()) {
      // 空内容（纯工具调用消息），不输出
      streamChannel.emit({ event: 'done', payload: { type: 'chat' } });
      return { isDone: true };
    }

    // ── 1. 分割 think tag ──
    const thinkTagState = { inThink: false, pending: '' };
    const tagged = splitThinkTaggedDelta(rawContent, thinkTagState);

    if (tagged.reasoningDelta) {
      streamChannel.emit({
        event: 'thinking_delta',
        payload: { delta: tagged.reasoningDelta },
      });
    }

    const finalAnswer = tagged.answerDelta || rawContent;

    // ── 2. 规范化并 emit ──
    const normalized = deps.chatResponseService.normalizeAssistantReply(
      finalAnswer.trim(),
    );

    // 分块 emit chat_delta
    for (const event of deps.chatStreamService.emitChatDeltaChunks(
      normalized,
    )) {
      streamChannel.emit(event as unknown as AgentEvent);
    }

    // ── 3. 保存会话历史 ──
    const sessionKey = deps.chatSessionService.getSessionKey(
      userId || undefined,
      sessionId,
    );
    deps.chatSessionService.appendHistory(
      sessionKey,
      userInput,
      normalized,
      10,
    );

    logger.log(
      `[Agent] stream_end userId=${userId} replyLen=${normalized.length}`,
    );

    // ── 4. emit done ──
    streamChannel.emit({ event: 'done', payload: { type: 'chat' } });

    return { isDone: true };
  };
}
