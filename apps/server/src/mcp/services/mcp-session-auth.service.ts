import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const MCP_SESSION_AUTH_PREFIX = 'mcp:session:auth:';
const MCP_SESSION_AUTH_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class McpSessionAuthService {
  constructor(private readonly redisService: RedisService) {}

  private readonly sessionUserMap = new Map<string, number>();

  async setSessionUser(sessionId: string, userId: number): Promise<void> {
    this.sessionUserMap.set(sessionId, userId);
    await this.redisService.set(
      `${MCP_SESSION_AUTH_PREFIX}${sessionId}`,
      String(userId),
      MCP_SESSION_AUTH_TTL_SECONDS,
    );
  }

  async getSessionUser(sessionId: string): Promise<number | null> {
    const cachedUserId = this.sessionUserMap.get(sessionId);
    if (cachedUserId) {
      return cachedUserId;
    }

    const persistedUserId = await this.redisService.get(
      `${MCP_SESSION_AUTH_PREFIX}${sessionId}`,
    );
    if (!persistedUserId) {
      return null;
    }

    const userId = Number(persistedUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }
    this.sessionUserMap.set(sessionId, userId);
    return userId;
  }

  async clearSessionUser(sessionId: string): Promise<void> {
    this.sessionUserMap.delete(sessionId);
    await this.redisService.del(`${MCP_SESSION_AUTH_PREFIX}${sessionId}`);
  }
}
