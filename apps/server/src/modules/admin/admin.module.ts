import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { Blog } from '../../entities/blog.entity';
import { Comment } from '../../entities/comment.entity';
import { Topic } from '../../entities/topic.entity';
import { ViewLog } from '../../entities/view-log.entity';
import { MomentViewLog } from '../../entities/moment-view-log.entity';
import { SiteViewLog } from '../../entities/site-view-log.entity';
import { MomentComment } from '../../entities/moment-comment.entity';
import { Moment } from '../../entities/moment.entity';
import { SystemAnnouncement } from '../../entities/system-announcement.entity';
import { AdminGuard } from './guards/admin.guard';
import { SocialModule } from '../../social/social.module';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';

@Module({
  imports: [
    SocialModule,
    TypeOrmModule.forFeature([
      User,
      Blog,
      Comment,
      Topic,
      ViewLog,
      MomentViewLog,
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
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, AdminJwtStrategy],
  exports: [AdminService, AdminGuard],
})
export class AdminModule {}
