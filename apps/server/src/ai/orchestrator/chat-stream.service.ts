import { Injectable } from '@nestjs/common';
import { CHAT_STREAM_CHUNK_SIZE } from '../constants';
import { splitTextToChunks } from '../utils/text';
import type { AIStreamEvent } from './types';

/**
 * 流式输出工具服务
 *
 * 职责：
 * 1. 流式 LLM 调用的 chunk 拆分与事件发射
 * 2. think tag 分割辅助
 */
@Injectable()
export class ChatStreamService {
  /**
   * 将一段完整文本按 CHAT_STREAM_CHUNK_SIZE 拆分为多个 chat_delta 事件
   */
  *emitChatDeltaChunks(content: string): Generator<AIStreamEvent> {
    const chunks = splitTextToChunks(content, CHAT_STREAM_CHUNK_SIZE);
    for (const chunk of chunks) {
      yield { event: 'chat_delta', payload: { delta: chunk } };
    }
  }

  /**
   * 将 think_delta 文本拆分为多个 thinking_delta 事件
   */
  *emitThinkingDeltaChunks(content: string): Generator<AIStreamEvent> {
    const chunks = splitTextToChunks(content, CHAT_STREAM_CHUNK_SIZE);
    for (const chunk of chunks) {
      yield { event: 'thinking_delta', payload: { delta: chunk } };
    }
  }
}
