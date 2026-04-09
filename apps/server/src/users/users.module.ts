import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FollowsController } from '../social/controllers';
import { SocialModule } from '../social/social.module';
import { User } from '../entities/user.entity';
import { UserResume } from '../entities/user-resume.entity';

/**
 * 关注路由注册在 UsersModule，与 UsersController 同属 `users` 前缀，
 * 避免多模块重复 @Controller('users') 时 Express 路由表合并顺序导致 POST /users/:id/follow 404。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserResume]),
    forwardRef(() => SocialModule),
  ],
  providers: [UsersService],
  controllers: [UsersController, FollowsController],
  exports: [UsersService],
})
export class UsersModule {}
