import type { Type } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { AIModule } from '../../ai/ai.module';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { AuthModule } from '../../auth/auth.module';
import { BlogsModule } from '../../blogs/blogs.module';
import { CalendarModule } from '../../calendar/calendar.module';
import { CommentsModule } from '../../comments/comments.module';
import { FavoritesModule } from '../../favorites/favorites.module';
import { HotsearchModule } from '../../hotsearch/hotsearch.module';
import { LikesModule } from '../../likes/likes.module';
import { AdminModule } from '../../modules/admin/admin.module';
import { MomentsModule } from '../../moments/moments.module';
import { NoteCollectionsModule } from '../../note-collections/note-collections.module';
import { NotesModule } from '../../notes/notes.module';
import { SocialModule } from '../../social/social.module';
import { TodosModule } from '../../todos/todos.module';
import { TopicsModule } from '../../topics/topics.module';
import { UploadModule } from '../../upload/upload.module';
import { UsersModule } from '../../users/users.module';
import { WeatherModule } from '../../weather/weather.module';

/**
 * 供「用户站 / 公开 API」Swagger 文档扫描的模块（与 {@link AppModule} 中业务模块一致，排除 {@link AdminModule}）。
 * 需包含 {@link AppModule} 以纳入根 {@link AppController}。
 */
export const SWAGGER_PUBLIC_MODULES: Type<unknown>[] = [
  AppModule,
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
  NotesModule,
  NoteCollectionsModule,
  AIModule,
  SocialModule,
];

/** 供「管理后台」独立 Swagger 文档扫描的模块 */
export const SWAGGER_ADMIN_MODULES: Type<unknown>[] = [
  AdminModule,
  AnalyticsModule,
];
