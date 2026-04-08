import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogsModule } from './blogs/blogs.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { FavoritesModule } from './favorites/favorites.module';
import { TodosModule } from './todos/todos.module';
import { CalendarModule } from './calendar/calendar.module';
import { UploadModule } from './upload/upload.module';
import { MomentsModule } from './moments/moments.module';
import { TopicsModule } from './topics/topics.module';
import { HotsearchModule } from './hotsearch/hotsearch.module';
import { WeatherModule } from './weather/weather.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotesModule } from './notes/notes.module';
import { NoteCollectionsModule } from './note-collections/note-collections.module';
import { AIModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedisModule } from './redis/redis.module';
import { Video } from './entities/video.entity';
import { UserResume } from './entities/user-resume.entity';
import { User } from './entities/user.entity';
import { Blog } from './entities/blog.entity';
import { Comment } from './entities/comment.entity';
import { Todo } from './entities/todo.entity';
import { Like } from './entities/like.entity';
import { Favorite } from './entities/favorite.entity';
import { ViewLog } from './entities/view-log.entity';
import { Moment } from './entities/moment.entity';
import { Topic } from './entities/topic.entity';
import { MomentComment } from './entities/moment-comment.entity';
import { MomentLike } from './entities/moment-like.entity';
import { MomentFavorite } from './entities/moment-favorite.entity';
import { MomentViewLog } from './entities/moment-view-log.entity';
import { CalendarEvent } from './entities/calendar-event.entity';
import { CommentLike } from './entities/comment-like.entity';
import { MomentCommentLike } from './entities/moment-comment-like.entity';
import { Note } from './entities/note.entity';
import { NoteComment } from './entities/note-comment.entity';
import { NoteCommentLike } from './entities/note-comment-like.entity';
import { NoteLike } from './entities/note-like.entity';
import { NoteFavorite } from './entities/note-favorite.entity';
import { NoteViewLog } from './entities/note-view-log.entity';
import { SiteViewLog } from './entities/site-view-log.entity';
import {
  NoteCollection,
  NoteCollectionItem,
} from './entities/note-collection.entity';
import { UserAIConfig } from './entities/user-ai-config.entity';
import { UserFollow } from './entities/user-follow.entity';
import { DirectConversation } from './entities/direct-conversation.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { UserNotification } from './entities/user-notification.entity';
import { SystemAnnouncement } from './entities/system-announcement.entity';
import { SocialModule } from './social/social.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TrackEvent } from './entities/track-event.entity';
import { PerformanceMetric } from './entities/performance-metric.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_DATABASE || 'blog',
      entities: [
        User,
        UserResume,
        Blog,
        Comment,
        Like,
        Favorite,
        Todo,
        ViewLog,
        Moment,
        Topic,
        MomentComment,
        MomentLike,
        MomentFavorite,
        MomentViewLog,
        CalendarEvent,
        CommentLike,
        MomentCommentLike,
        Note,
        NoteComment,
        NoteLike,
        NoteFavorite,
        NoteViewLog,
        SiteViewLog,
        NoteCommentLike,
        NoteCollection,
        NoteCollectionItem,
        Video,
        UserAIConfig,
        UserFollow,
        DirectConversation,
        DirectMessage,
        UserNotification,
        SystemAnnouncement,
        TrackEvent,
        PerformanceMetric,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    RedisModule,
    BlogsModule,
    UsersModule,
    AuthModule,
    CommentsModule,
    LikesModule,
    CalendarModule,
    FavoritesModule,
    TodosModule,
    UploadModule,
    MomentsModule,
    TopicsModule,
    HotsearchModule,
    WeatherModule,
    AdminModule,
    NotesModule,
    NoteCollectionsModule,
    AIModule,
    McpModule,
    SocialModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
