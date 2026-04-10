import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatShareService } from './chat-share.service';
import { ChatShareController } from './chat-share.controller';
import { ShareSession } from '../entities/share-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShareSession])],
  controllers: [ChatShareController],
  providers: [ChatShareService],
  exports: [ChatShareService],
})
export class ChatShareModule {}
