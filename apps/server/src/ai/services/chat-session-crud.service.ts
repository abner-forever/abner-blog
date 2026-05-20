import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../../entities/chat-session.entity';

@Injectable()
export class ChatSessionCrudService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
  ) {}

  async listSessions(userId: number): Promise<ChatSession[]> {
    return this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  async saveSession(
    userId: number,
    sessionId: string,
    data: { title: string; messages: Record<string, unknown>[]; model: string },
  ): Promise<ChatSession> {
    const existing = await this.sessionRepo.findOne({
      where: { userId, sessionId },
    });

    if (existing) {
      existing.title = data.title;
      existing.messages = data.messages;
      existing.model = data.model;
      return this.sessionRepo.save(existing);
    }

    const session = this.sessionRepo.create({
      userId,
      sessionId,
      title: data.title,
      messages: data.messages,
      model: data.model,
    });
    return this.sessionRepo.save(session);
  }

  async deleteSession(userId: number, sessionId: string): Promise<void> {
    await this.sessionRepo.delete({ userId, sessionId });
  }

  async deleteAllSessions(userId: number): Promise<void> {
    await this.sessionRepo.delete({ userId });
  }
}
