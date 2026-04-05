import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MomentsService } from './moments.service';
import { MomentsController } from './moments.controller';
import { Moment } from '../entities/moment.entity';
import { MomentComment } from '../entities/moment-comment.entity';
import { MomentLike } from '../entities/moment-like.entity';
import { MomentFavorite } from '../entities/moment-favorite.entity';
import { MomentViewLog } from '../entities/moment-view-log.entity';
import { Topic } from '../entities/topic.entity';
import { MomentCommentLike } from '../entities/moment-comment-like.entity';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    SocialModule,
    TypeOrmModule.forFeature([
      Moment,
      MomentComment,
      MomentLike,
      MomentFavorite,
      MomentViewLog,
      MomentCommentLike,
      Topic,
    ]),
  ],
  controllers: [MomentsController],
  providers: [MomentsService],
  exports: [MomentsService],
})
export class MomentsModule {}
