import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../../entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    role: string;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.role !== String(UserRole.ADMIN)) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}
