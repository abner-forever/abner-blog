import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { ChunkUploadService } from './chunk-upload.service';
import { Video } from '../entities/video.entity';

@Module({
  imports: [MulterModule.register({}), TypeOrmModule.forFeature([Video])],
  controllers: [UploadController],
  providers: [ChunkUploadService],
  exports: [ChunkUploadService],
})
export class UploadModule {}
