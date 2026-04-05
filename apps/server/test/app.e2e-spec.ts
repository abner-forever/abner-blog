import type { Server } from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  it('/api (GET) returns wrapped hello', async () => {
    const res = await request(app.getHttpServer() as Server)
      .get('/api')
      .expect(200);
    expect(res.body).toMatchObject({
      success: true,
      code: 0,
      data: 'Hello World!',
    });
  });
});
