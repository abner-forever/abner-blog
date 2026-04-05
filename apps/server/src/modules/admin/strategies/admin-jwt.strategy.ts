import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

export interface AdminJwtPayload {
  sub: number;
  username: string;
  role: string;
}

export interface AdminJwtUser {
  userId: number;
  username: string;
  role: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-secret-key-please-change-in-production',
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminJwtUser> {
    if (!payload.sub || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('无效的 Token');
    }

    // 从数据库获取完整的用户信息（包括 role）
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'username', 'role', 'status'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
