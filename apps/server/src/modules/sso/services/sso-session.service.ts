import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../../../redis/redis.service';
import {
  SSO_SESSION_PREFIX,
  SSO_COOKIE_NAME,
} from '../sso.constants';
import { SessionData } from '../interfaces/session-data.interface';

/**
 * SSOSessionService — 会话 CRUD
 *
 * 职责：
 * - 使用 Redis 存储 SSO 会话数据
 * - 支持滑动过期（每次访问刷新 TTL）
 * - 生成 uuid 作为 sessionId，返回给 Set-Cookie
 */
@Injectable()
export class SSOSessionService {
  private readonly logger = new Logger(SSOSessionService.name);
  private readonly sessionTtlSeconds: number;
  private readonly cookieName: string;

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.sessionTtlSeconds =
      this.configService.get<number>('SSO_SESSION_TTL_SECONDS', 28800);
    this.cookieName = SSO_COOKIE_NAME;
  }

  /**
   * 创建新的 SSO 会话
   * 生成 uuid 作为 sessionId，将用户数据存入 Redis
   * @returns sessionId（用于 Set-Cookie）
   */
  async createSession(
    userId: number,
    username: string,
    role: string,
    keycloakSub: string,
    email: string,
  ): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const sessionData: SessionData = {
      userId,
      username,
      role,
      keycloakSub,
      email,
      createdAt: now,
      lastActivityAt: now,
    };

    const redisKey = `${SSO_SESSION_PREFIX}${sessionId}`;
    await this.redisService.set(
      redisKey,
      JSON.stringify(sessionData),
      this.sessionTtlSeconds,
    );

    this.logger.log(`SSO 会话创建成功: sessionId=${sessionId}, userId=${userId}`);
    return sessionId;
  }

  /**
   * 根据 sessionId 获取会话数据
   * 查找成功时自动刷新 TTL（滑窗策略）
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const redisKey = `${SSO_SESSION_PREFIX}${sessionId}`;
    const raw = await this.redisService.get(redisKey);

    if (!raw) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(raw);

      // 滑动刷新 TTL
      await this.refreshSessionTTL(sessionId);

      return sessionData;
    } catch {
      this.logger.warn(`SSO 会话数据解析失败: sessionId=${sessionId}`);
      return null;
    }
  }

  /**
   * 删除 SSO 会话（登出时调用）
   */
  async deleteSession(sessionId: string): Promise<void> {
    const redisKey = `${SSO_SESSION_PREFIX}${sessionId}`;
    await this.redisService.del(redisKey);
    this.logger.log(`SSO 会话已删除: sessionId=${sessionId}`);
  }

  /**
   * 滑动刷新会话 TTL
   * 每次访问 API 时调用，延长过期时间
   */
  async refreshSessionTTL(sessionId: string): Promise<void> {
    const redisKey = `${SSO_SESSION_PREFIX}${sessionId}`;
    // 使用 Redis 的 EXPIRE 命令延长 TTL
    // RedisService 没有直接暴露 expire 方法，用 set 再覆盖一次
    const raw = await this.redisService.get(redisKey);
    if (raw) {
      await this.redisService.set(
        redisKey,
        raw,
        this.sessionTtlSeconds,
      );
    }
  }

  /**
   * 获取 Cookie 名称
   */
  getCookieName(): string {
    return this.cookieName;
  }

  /**
   * 获取 Cookie 配置
   */
  getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
    domain?: string;
  } {
    return {
      httpOnly: true,
      secure:
        this.configService.get<string>('SSO_COOKIE_SECURE', 'false') === 'true',
      sameSite: 'lax',
      path: '/api',
      maxAge: this.sessionTtlSeconds,
      domain:
        this.configService.get<string>('SSO_COOKIE_DOMAIN') || undefined,
    };
  }
}
