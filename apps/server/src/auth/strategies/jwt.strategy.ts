import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/** Access JWT payload（Bearer 用于受保护接口） */
export interface JwtPayload {
  sub: number;
  username: string;
  typ: 'access';
}

/** Refresh JWT payload */
export interface JwtRefreshPayload {
  sub: number;
  username: string;
  typ: 'refresh';
  jti: string;
}

export interface JwtUser {
  userId: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-secret-key-please-change-in-production',
    });
  }

  validate(payload: JwtPayload): JwtUser {
    if (!payload.sub || typeof payload.sub !== 'number' || isNaN(payload.sub)) {
      this.logger.error('Invalid sub in JWT payload:', payload);
      throw new UnauthorizedException('无效的 Token');
    }

    if (payload.typ !== 'access') {
      throw new UnauthorizedException('无效的 Token');
    }

    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
