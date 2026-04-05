import { Injectable } from '@nestjs/common';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';

@Injectable()
export class AIChatSessionService {
  private readonly chatSessionHistory = new Map<string, BaseMessage[]>();

  getSessionKey(userId: number, sessionId?: string): string {
    return `${userId}:${sessionId || 'default'}`;
  }

  getHistoryMessages(sessionKey: string): BaseMessage[] {
    return this.chatSessionHistory.get(sessionKey) || [];
  }

  appendHistory(
    sessionKey: string,
    userMessage: string,
    assistantReply: string,
    maxHistoryMessages: number,
  ): void {
    if (!userMessage.trim() || !assistantReply.trim()) return;
    const prev = this.chatSessionHistory.get(sessionKey) || [];
    const next = [
      ...prev,
      new HumanMessage(userMessage),
      new AIMessage(assistantReply),
    ];
    this.chatSessionHistory.set(sessionKey, next.slice(-maxHistoryMessages));
  }
}
