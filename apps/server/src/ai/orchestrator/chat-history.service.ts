import { Injectable } from '@nestjs/common';
import { type BaseMessage } from '@langchain/core/messages';
import { IntentType, ChatResponseDto } from '../dto/extraction-result.dto';
import { AIChatSessionService } from '../services/ai-chat-session.service';
import { buildIntentMemoryReply } from '../utils/chat-history';

@Injectable()
export class ChatHistoryService {
  private readonly maxHistoryMessages = 10;

  constructor(private readonly chatSessionService: AIChatSessionService) {}

  /**
   * 取最近若干条 BaseMessage 供 LLM；保证条数为偶数，避免从半截 AIMessage 起截导致上下文错位。
   */
  sliceHistoryForContext(
    history: BaseMessage[],
    contextWindow: number,
  ): BaseMessage[] {
    if (!history.length) return [];
    const capped = Math.min(history.length, Math.max(1, contextWindow));
    let take = capped % 2 === 0 ? capped : capped - 1;
    if (take < 2 && history.length >= 2) take = 2;
    if (take < 1) take = 1;
    return history.slice(-take);
  }

  appendIntentResultToHistoryIfNeeded(
    intent: IntentType,
    userMessage: string,
    userId: number | undefined,
    sessionId: string | undefined,
    result: ChatResponseDto,
  ): void {
    // CHAT / QUERY_WEATHER 分支已在各自处理函数中写入历史，这里避免重复写入。
    if (intent === IntentType.CHAT || intent === IntentType.QUERY_WEATHER) {
      return;
    }
    const assistantReply = buildIntentMemoryReply(result);
    if (!assistantReply) return;
    const sessionKey = this.chatSessionService.getSessionKey(userId, sessionId);
    this.chatSessionService.appendHistory(
      sessionKey,
      userMessage,
      assistantReply,
      this.maxHistoryMessages,
    );
  }
}
