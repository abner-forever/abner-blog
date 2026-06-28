import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PageGeneratorConfig } from './entities/page-generator-config.entity';
import { AiGenerationTask } from './entities/ai-generation-task.entity';
import { PageGeneratorController } from './page-generator.controller';
import { PageGeneratorService } from './page-generator.service';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PageGeneratorConfig, AiGenerationTask]),
    PassportModule,
    PagesModule,
  ],
  controllers: [PageGeneratorController],
  providers: [PageGeneratorService],
  exports: [PageGeneratorService],
})
export class PageGeneratorModule {}
