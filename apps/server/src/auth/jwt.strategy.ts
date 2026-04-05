import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

export interface JwtPayload {
  sub: number;
  username: string;
}

export interface JwtUser {
  userId: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 关闭 JWT 自带过期校验，由 Redis 滑动 TTL 统一管控
      ignoreExpiration: true,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-secret-key-please-change-in-production',
      passReqToCallback: true,
    });
  }

  async validate(
    req: AuthenticatedRequest,
    payload: JwtPayload,
  ): Promise<JwtUser> {
    if (!payload.sub || typeof payload.sub !== 'number' || isNaN(payload.sub)) {
      this.logger.error('Invalid sub in JWT payload:', payload);
      throw new UnauthorizedException('无效的 Token');
    }

    // 从请求头提取原始 token
    const authHeader =
      req.headers?.authorization || req.headers?.Authorization || '';
    const authHeaderStr = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;
    const token = authHeaderStr?.startsWith('Bearer ')
      ? authHeaderStr.slice(7)
      : null;

    if (token) {
      const isValid = await this.redisService.isTokenValid(token);
      if (!isValid) {
        throw new UnauthorizedException('登录已过期，请重新登录');
      }
      // 滑动窗口：每次有效请求重置 30 天 TTL
      await this.redisService.refreshTokenTTL(token);
    }

    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
