import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtUser {
  userId: number;
  username: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: TUser,
    // info: unknown,
  ): TUser {
    // this.logger.debug('JwtAuthGuard handleRequest:', { err, user, info });

    if (err || !user) {
      this.logger.error('JWT authentication failed:', err || 'No user found');
      throw new UnauthorizedException('认证失败');
    }

    const jwtUser = user as JwtUser;
    if (
      !jwtUser.userId ||
      typeof jwtUser.userId !== 'number' ||
      isNaN(jwtUser.userId)
    ) {
      this.logger.error('Invalid user ID in JWT payload:', jwtUser);
      throw new UnauthorizedException('无效的用户ID');
    }

    return user;
  }
}
