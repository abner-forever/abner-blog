import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { Blog } from '../../entities/blog.entity';
import { Comment } from '../../entities/comment.entity';
import { Topic } from '../../entities/topic.entity';
import { SiteViewLog } from '../../entities/site-view-log.entity';
import { MomentComment } from '../../entities/moment-comment.entity';
import { Moment } from '../../entities/moment.entity';
import { SystemAnnouncement } from '../../entities/system-announcement.entity';
import { AdminGuard } from './guards/admin.guard';
import { SocialModule } from '../../social/social.module';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminTopicsController } from './controllers/admin-topics.controller';
import { AdminCommentsController } from './controllers/admin-comments.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminBlogsController } from './controllers/admin-blogs.controller';
import { AdminMomentsController } from './controllers/admin-moments.controller';
import { AdminSystemAnnouncementsController } from './controllers/admin-system-announcements.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminTopicsService } from './services/admin-topics.service';
import { AdminCommentsService } from './services/admin-comments.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminBlogsService } from './services/admin-blogs.service';
import { AdminMomentsService } from './services/admin-moments.service';
import { AdminSystemAnnouncementsService } from './services/admin-system-announcements.service';

@Module({
  imports: [
    SocialModule,
    TypeOrmModule.forFeature([
      User,
      Blog,
      Comment,
      Topic,
      SiteViewLog,
      MomentComment,
      Moment,
      SystemAnnouncement,
    ]),
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-please-change-in-production',
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminTopicsController,
    AdminCommentsController,
    AdminUsersController,
    AdminBlogsController,
    AdminMomentsController,
    AdminSystemAnnouncementsController,
  ],
  providers: [
    AdminAuthService,
    AdminDashboardService,
    AdminTopicsService,
    AdminCommentsService,
    AdminUsersService,
    AdminBlogsService,
    AdminMomentsService,
    AdminSystemAnnouncementsService,
    AdminGuard,
    AdminJwtStrategy,
  ],
  exports: [AdminGuard],
})
export class AdminModule {}
