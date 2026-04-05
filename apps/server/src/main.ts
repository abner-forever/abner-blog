import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { RootFileLogger } from './common/logger/root-file.logger';
import {
  setupCors,
  setupGlobalAppFeatures,
  setupSwagger,
} from './common/bootstrap/app-setup';
import { registerVideoCoverRoute } from './upload/video-cover.route';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new RootFileLogger(),
    bodyParser: false,
  });

  // 热重载/watch 重启时会发 SIGTERM；先关 HTTP 再退出，避免新进程抢 8080 时出现 EADDRINUSE
  app.enableShutdownHooks();

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));

  setupCors(app);
  setupGlobalAppFeatures(app);
  setupSwagger(app);
  const uploadsRoot = join(__dirname, '..', 'uploads');
  registerVideoCoverRoute(app, uploadsRoot);

  app.useStaticAssets(join(uploadsRoot, 'assets'), {
    prefix: '/assets',
  });

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
