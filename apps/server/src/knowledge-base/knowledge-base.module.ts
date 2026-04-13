import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { AIConfigModule } from '../ai/ai-config.module';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBase } from '../entities/knowledge-base.entity';
import { KnowledgeChunk } from '../entities/knowledge-chunk.entity';
import { knowledgeBaseMulterOptions } from './multer.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeBase, KnowledgeChunk]),
    MulterModule.register(knowledgeBaseMulterOptions),
    AIConfigModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
