import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** token 在 Redis 中的滑动过期时间：30 天（秒） */
const TOKEN_TTL = 30 * 24 * 60 * 60;
const TOKEN_PREFIX = 'auth:token:';

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

  // ─── Token 相关操作 ────────────────────────────────────────────────

  /** 登录/注册成功后将 token 存入 Redis，TTL 30 天 */
  async storeToken(token: string, userId: number): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable('Redis 未就绪，storeToken 跳过（降级继续）');
      return;
    }

    try {
      await client.setex(`${TOKEN_PREFIX}${token}`, TOKEN_TTL, String(userId));
    } catch (err) {
      // Redis 不可用时降级：JWT 本身仍然有效，isTokenValid 也会降级放行
      this.logger.warn(
        `Redis storeToken 失败，降级继续登录 (userId=${userId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** 校验 token 是否在 Redis 中有效 */
  async isTokenValid(token: string): Promise<boolean> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      // Redis 不可用时放行，避免因 Redis 故障导致全体用户掉线
      this.logRedisUnavailable('Redis 未就绪，token 校验降级放行');
      return true;
    }

    try {
      const result = await client.exists(`${TOKEN_PREFIX}${token}`);
      return result === 1;
    } catch (err) {
      // Redis 不可用时放行，避免因 Redis 故障导致全体用户掉线
      this.logRedisUnavailable(
        `Redis 校验失败，降级放行: ${err instanceof Error ? err.message : String(err)}`,
      );
      return true;
    }
  }

  /** 每次请求刷新 token TTL（滑动窗口） */
  async refreshTokenTTL(token: string): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable('Redis 未就绪，跳过 TTL 刷新');
      return;
    }

    try {
      await client.expire(`${TOKEN_PREFIX}${token}`, TOKEN_TTL);
    } catch (err) {
      this.logRedisUnavailable(
        `Redis TTL 刷新失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** 登出或主动失效 token */
  async revokeToken(token: string): Promise<void> {
    const client = this.client;
    if (!this.isRedisReady() || !client) {
      this.logRedisUnavailable('Redis 未就绪，revokeToken 跳过');
      return;
    }

    try {
      await client.del(`${TOKEN_PREFIX}${token}`);
    } catch (err) {
      this.logger.warn(
        `Redis revokeToken 失败: ${err instanceof Error ? err.message : String(err)}`,
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
