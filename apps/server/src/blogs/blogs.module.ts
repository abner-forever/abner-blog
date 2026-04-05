import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog } from '../entities/blog.entity';
import { Like } from '../entities/like.entity';
import { Favorite } from '../entities/favorite.entity';
import { ViewLog } from '../entities/view-log.entity';
import { Comment } from '../entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, Like, Favorite, ViewLog, Comment])],
  controllers: [BlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}
