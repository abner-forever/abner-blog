import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAIConfig } from '../entities/user-ai-config.entity';
import { AIConfigService } from './services/ai-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserAIConfig])],
  providers: [AIConfigService],
  exports: [AIConfigService],
})
export class AIConfigModule {}
