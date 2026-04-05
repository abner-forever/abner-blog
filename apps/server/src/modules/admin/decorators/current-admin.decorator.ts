import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AdminUser {
  userId: number;
  username: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user: AdminUser;
}

export const CurrentAdmin = createParamDecorator(
  (
    data: keyof AdminUser | undefined,
    ctx: ExecutionContext,
  ): AdminUser | number | string | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
