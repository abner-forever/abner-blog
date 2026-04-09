import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtUser {
  userId: number;
  username: string;
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: JwtUser | null,
  ): TUser | null {
    // 如果有错误或没有用户，不抛出异常，而是返回null
    // 这样即使没有token或token无效，请求也能继续执行
    if (err || !user) {
      return null;
    }
    return user as TUser;
  }
}
