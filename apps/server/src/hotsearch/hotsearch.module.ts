import { Module } from '@nestjs/common';
import { HotsearchController } from './hotsearch.controller';
import { HotsearchService } from './hotsearch.service';

@Module({
  controllers: [HotsearchController],
  providers: [HotsearchService],
  exports: [HotsearchService],
})
export class HotsearchModule {}
