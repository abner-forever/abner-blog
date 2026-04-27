import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method: string = request.method;
    const url: string = request.url;
    const body = request.body as Record<string, unknown> | undefined;
    const query: Record<string, unknown> = request.query as Record<
      string,
      unknown
    >;
    const params: Record<string, string> = request.params as Record<
      string,
      string
    >;
    const headers: Record<string, string | string[] | undefined> =
      request.headers as Record<string, string | string[] | undefined>;
    const startTime = Date.now();

    // 记录请求信息
    this.logger.log(`📥 ${method} ${url}`, 'Request');

    // 打印详细的请求信息
    if (Object.keys(query).length > 0) {
      this.logger.log(`Query: ${JSON.stringify(query)}`, 'Request');
    }

    if (Object.keys(params).length > 0) {
      this.logger.log(`Params: ${JSON.stringify(params)}`, 'Request');
    }

    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      // 过滤敏感信息
      const sanitizedBody: Record<string, unknown> = { ...body };
      if ('password' in sanitizedBody) {
        sanitizedBody.password = '***';
      }
      if (
        'apiKey' in sanitizedBody &&
        typeof sanitizedBody.apiKey === 'string'
      ) {
        const k = sanitizedBody.apiKey;
        sanitizedBody.apiKey =
          k.length <= 8 ? '***' : `${k.slice(0, 4)}***${k.slice(-4)}`;
      }
      if ('images' in sanitizedBody && Array.isArray(sanitizedBody.images)) {
        const n = sanitizedBody.images.length;
        sanitizedBody.images = { count: n, redacted: true };
      }
      this.logger.log(`Body: ${JSON.stringify(sanitizedBody)}`, 'Request');
    }

    // 记录用户信息（如果有认证）
    const userAgent = headers['user-agent'];
    if (userAgent && typeof userAgent === 'string') {
      this.logger.log(`User-Agent: ${userAgent}`, 'Request');
    }
    // 记录用户信息（如果有认证）
    // const userToken = headers['authorization'];
    // if (userToken && typeof userToken === 'string') {
    //   this.logger.log(`User-Token: ${userToken}`, 'Request');
    // }

    return next.handle().pipe(
      tap({
        next: (responseBody: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // 记录响应信息
          this.logger.log(
            `📤 ${method} ${url} ${statusCode} - ${duration}ms`,
            'Response',
          );

          // 打印响应体（可选，避免过长的响应）
          if (responseBody && typeof responseBody === 'object') {
            const responseStr = JSON.stringify(responseBody);
            if (responseStr.length < 1000) {
              this.logger.log(`Response Body: ${responseStr}`, 'Response');
            } else {
              this.logger.log(
                `Response Body: [Large response - ${responseStr.length} chars]`,
                'Response',
              );
            }
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          this.logger.error(
            `❌ ${method} ${url} ${statusCode} - ${duration}ms`,
            error?.stack || error?.message || 'Unknown error',
            'Response',
          );
        },
      }),
    );
  }
}
