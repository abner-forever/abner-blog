import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIConfigModule } from '../ai/ai-config.module';
import { SkillsService } from './skills.service';
import { SkillVectorService } from './skill-vector.service';
import { SkillsController } from './skills.controller';
import { Skill } from '../entities/skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Skill]), AIConfigModule],
  controllers: [SkillsController],
  providers: [SkillsService, SkillVectorService],
  exports: [SkillsService],
})
export class SkillsModule {}
