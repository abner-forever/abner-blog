import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, CommentLike]), SocialModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
