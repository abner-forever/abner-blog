import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogsService } from './blogs/blogs.service';
import { MomentsService } from './moments/moments.service';
import { DataSource } from 'typeorm';

describe('AppController', () => {
  let appController: AppController;

  const mockBlogsService = { count: jest.fn().mockResolvedValue(0) };
  const mockMomentsService = { count: jest.fn().mockResolvedValue(0) };
  const mockDataSource = {
    getRepository: jest
      .fn()
      .mockReturnValue({ count: jest.fn().mockResolvedValue(0) }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: BlogsService, useValue: mockBlogsService },
        { provide: MomentsService, useValue: mockMomentsService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
