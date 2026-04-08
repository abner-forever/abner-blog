import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from '../interfaces/response.interface';

const SENSITIVE_RESPONSE_FIELDS = new Set([
  'password',
  'resetPasswordToken',
  'resetPasswordExpires',
  'verificationCode',
  'verificationCodeExpires',
]);

function sanitizeResponseData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponseData(item));
  }

  if (!data || typeof data !== 'object' || data instanceof Date) {
    return data;
  }

  const source = data as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  Object.entries(source).forEach(([key, value]) => {
    if (SENSITIVE_RESPONSE_FIELDS.has(key)) {
      return;
    }
    sanitized[key] = sanitizeResponseData(value);
  });

  return sanitized;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<{ path?: string }>();
    return next.handle().pipe(
      map((data) => {
        // MCP 路由直接返回原始响应，不经过响应包装
        // MCP 使用标准 JSON-RPC 协议，不需要响应包装
        // MCP 路由直接返回原始响应，不经过响应包装
        // MCP 使用标准 JSON-RPC 协议，不需要响应包装
        // 注意：实际路径是 /api/mcp
        if (request.path?.includes('/mcp')) {
          return data as unknown as Response<T>;
        }
        return {
          success: true,
          code: 0,
          message: 'success',
          data: sanitizeResponseData(data) as T,
          timestamp: new Date().toLocaleString(),
        };
      }),
    );
  }
}
