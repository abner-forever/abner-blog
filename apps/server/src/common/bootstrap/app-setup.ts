import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { TransformInterceptor } from '../interceptors/transform.interceptor';

/**
 * Nest 对无 @HttpCode 的 POST 默认使用 201，且在拦截器之后仍会调用 adapter.reply(..., 201)，
 * 拦截器里改 status 会被覆盖。此处统一在最终写响应前将 201 规范为 200。
 * （使用 @Res() 自行处理响应的路由不受影响，除非也传入 statusCode=201。）
 */
type ExpressAdapterReply = (
  response: unknown,
  body: unknown,
  statusCode?: number,
) => unknown;

function normalizeReplyCreatedToOk(app: NestExpressApplication): void {
  const server = app.getHttpAdapter() as { reply?: ExpressAdapterReply };
  const rawReply = server.reply;
  if (typeof rawReply !== 'function') return;
  const original = rawReply.bind(server) as ExpressAdapterReply;
  server.reply = (response, body, statusCode) => {
    const code = statusCode === 201 ? HttpStatus.OK : statusCode;
    return original(response, body, code);
  };
}

export function setupCors(app: NestExpressApplication): void {
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) =>
    o.trim(),
  ) || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}

export function setupSwagger(app: NestExpressApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('ABNER Blog 后端接口文档')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    jsonDocumentUrl: 'api-docs-json',
  });
}

export function setupGlobalAppFeatures(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const firstConstraint = Object.values(firstError.constraints || {})[0];
        return new BadRequestException(firstConstraint || '参数验证失败');
      },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  normalizeReplyCreatedToOk(app);
}
