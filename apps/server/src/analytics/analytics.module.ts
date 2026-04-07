import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TrackEvent } from '../entities/track-event.entity';
import { PerformanceMetric } from '../entities/performance-metric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrackEvent, PerformanceMetric])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
