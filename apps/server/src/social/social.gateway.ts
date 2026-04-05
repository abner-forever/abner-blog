import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { SocialEventsService } from './social-events.service';

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== 'object' || value === null) return false;
  const sub = (value as { sub?: unknown }).sub;
  return typeof sub === 'number' && !Number.isNaN(sub);
}

function parseCorsOrigins(): string[] {
  const raw =
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5174';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(),
    credentials: true,
  },
})
export class SocialGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SocialGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly socialEvents: SocialEventsService,
  ) {}

  afterInit(server: Server): void {
    this.socialEvents.setServer(server);
  }

  async handleConnection(client: Socket): Promise<void> {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const raw = auth?.token;
    const token =
      typeof raw === 'string'
        ? raw.startsWith('Bearer ')
          ? raw.slice(7)
          : raw
        : null;
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'your-secret-key-please-change-in-production';
      const decoded: unknown = this.jwtService.verify(token, {
        secret,
      });
      if (!isJwtPayload(decoded)) {
        client.disconnect(true);
        return;
      }
      const userId = decoded.sub;
      const ok = await this.redisService.isTokenValid(token);
      if (!ok) {
        client.disconnect(true);
        return;
      }
      await this.redisService.refreshTokenTTL(token);
      await client.join(`user:${userId}`);
      (client.data as { userId: number }).userId = userId;
    } catch (e) {
      this.logger.warn(
        `WS auth failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      client.disconnect(true);
    }
  }
}
