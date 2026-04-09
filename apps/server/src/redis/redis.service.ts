import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** 刷新会话在 Redis 中的 key 前缀（值为 userId 字符串，TTL 与 refresh JWT 一致） */
const REFRESH_PREFIX = 'auth:refresh:';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private lastUnavailableLogAt = 0;
  private readonly redisEnabled: boolean;

  private static readonly UNAVAILABLE_LOG_INTERVAL_MS = 30_000;

  constructor(private configService: ConfigService) {
    const redisEnabled = this.configService.get<string>('REDIS_ENABLED');
    this.redisEnabled =
      redisEnabled !== undefined
        ? redisEnabled.toLowerCase() === 'true'
        : process.env.NODE_ENV === 'production';
  }

  onModuleInit() {
    if (!this.redisEnabled) {
      this.logger.log('Redis 未启用，当前运行在降级模式');
      return;
    }

    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: this.configService.get<number>('REDIS_DB', 0),
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null; // 超过重试次数停止
        return Math.min(times * 300, 1000);
      },
    });

    this.client.on('connect', () => this.logger.log('Redis 连接成功'));
    this.client.on('ready', () => this.logger.log('Redis 已就绪'));
    this.client.on('error', (err) =>
      this.logRedisUnavailable(`Redis 连接错误: ${err.message}`),
    );
    this.client.on('end', () =>
      this.logRedisUnavailable('Redis 连接已关闭，进入降级模式'),
    );

    this.client
      .connect()
      .catch((err: Error) =>
        this.logRedisUnavailable(`Redis 初始连接失败: ${err.message}`),
      );
  }

  async onModuleDestroy() {
    if (this.client && this.client.status !== 'end') {
      await this.client.quit();
    }
  }

  private isRedisReady(): boolean {
    return this.redisEnabled && this.client?.status === 'ready';
  }

  private logRedisUnavailable(message: string): void {
    const now = Date.now();
    if (
      now - this.lastUnavailableLogAt >=
      RedisService.UNAVAILABLE_LOG_INTERVAL_MS
    ) {
      this.logger.warn(message);
      this.lastUnavailableLogAt = now;
    }
  }

  // ─── Refresh token 会话（jti）──────────────────────────────────────

  /** 签发 refresh JWT 后将 jti 写入 Redis */
  async storeRefreshSession(
    jti: string,
    userId: number,
    ttlSeconds: number,
  ): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable('Redis 未就绪，storeRefreshSession 跳过（降级继续）');
      return;
    }

    try {
      const sec = Math.max(1, Math.floor(ttlSeconds));
      await client.setex(`${REFRESH_PREFIX}${jti}`, sec, String(userId));
    } catch (err) {
      this.logger.warn(
        `Redis storeRefreshSession 失败，降级继续 (userId=${userId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** 校验 refresh 会话是否存在（Redis 不可用时降级为 true，仅依赖 JWT 校验） */
  async isRefreshSessionValid(jti: string): Promise<boolean> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable('Redis 未就绪，refresh 会话校验降级放行');
      return true;
    }

    try {
      const result = await client.exists(`${REFRESH_PREFIX}${jti}`);
      return result === 1;
    } catch (err) {
      this.logRedisUnavailable(
        `Redis refresh 校验失败，降级放行: ${err instanceof Error ? err.message : String(err)}`,
      );
      return true;
    }
  }

  /** 登出或轮换时吊销 refresh 会话 */
  async revokeRefreshSession(jti: string): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable('Redis 未就绪，revokeRefreshSession 跳过');
      return;
    }

    try {
      await client.del(`${REFRESH_PREFIX}${jti}`);
    } catch (err) {
      this.logger.warn(
        `Redis revokeRefreshSession 失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ─── 通用操作 ──────────────────────────────────────────────────────

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable(`Redis 未就绪，set 跳过 (key=${key})`);
      return;
    }

    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable(`Redis 未就绪，get 返回空值 (key=${key})`);
      return null;
    }

    return client.get(key);
  }

  async del(key: string): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable(`Redis 未就绪，del 跳过 (key=${key})`);
      return;
    }

    try {
      await client.del(key);
    } catch (err) {
      this.logger.warn(
        `Redis del 失败 (key=${key}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
