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
        // 仅 MCP JSON-RPC 协议端点（/api/mcp）返回原始响应，不走统一包装。
        // 注意不要误伤 /api/mcp-servers 这类业务 REST 路由。
        const path = request.path || '';
        const isRawMcpRpcPath =
          path === '/api/mcp' ||
          path.startsWith('/api/mcp/') ||
          path.startsWith('/api/mcp?');
        if (isRawMcpRpcPath) {
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
