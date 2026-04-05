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
    return next.handle().pipe(
      map((data) => ({
        success: true,
        code: 0,
        message: 'success',
        data: sanitizeResponseData(data) as T,
        timestamp: new Date().toLocaleString(),
      })),
    );
  }
}
