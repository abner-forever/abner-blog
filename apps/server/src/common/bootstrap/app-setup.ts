import {
  BadRequestException,
  HttpStatus,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import {
  SWAGGER_ADMIN_MODULES,
  SWAGGER_PUBLIC_MODULES,
} from './swagger-document-modules';

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
  const bearer = {
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: 'JWT',
  };

  const publicConfig = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('ABNER Blog 用户站 / 公开 REST 接口（不含管理后台）')
    .setVersion('1.0')
    .addBearerAuth(bearer, 'JWT')
    .build();
  const publicDocument = SwaggerModule.createDocument(app, publicConfig, {
    include: SWAGGER_PUBLIC_MODULES,
  });
  SwaggerModule.setup('api-docs', app, publicDocument, {
    jsonDocumentUrl: 'api-docs-json',
  });

  const adminConfig = new DocumentBuilder()
    .setTitle('Blog Admin API')
    .setDescription('ABNER Blog 管理后台 REST 接口')
    .setVersion('1.0')
    .addBearerAuth(bearer, 'JWT')
    .build();
  const adminDocument = SwaggerModule.createDocument(app, adminConfig, {
    include: SWAGGER_ADMIN_MODULES,
  });
  SwaggerModule.setup('api-admin-docs', app, adminDocument, {
    jsonDocumentUrl: 'api-admin-docs-json',
  });
}

export function setupGlobalAppFeatures(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'register', method: RequestMethod.POST },
      { path: 'authorize', method: RequestMethod.GET },
      { path: 'token', method: RequestMethod.POST },
    ],
  });
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
