import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserFollow } from '../entities/user-follow.entity';
import { DirectConversation } from '../entities/direct-conversation.entity';
import { DirectMessage } from '../entities/direct-message.entity';
import { UserNotification } from '../entities/user-notification.entity';
import { SystemAnnouncement } from '../entities/system-announcement.entity';
import { User } from '../entities/user.entity';
import { NoteComment } from '../entities/note-comment.entity';
import {
  ConversationsController,
  NotificationsController,
} from './controllers';
import {
  ConversationsService,
  FollowsService,
  NotificationsService,
  SocialEventsService,
} from './services';
import { SocialGateway } from './gateways';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserFollow,
      DirectConversation,
      DirectMessage,
      UserNotification,
      SystemAnnouncement,
      User,
      NoteComment,
    ]),
    AuthModule,
  ],
  controllers: [ConversationsController, NotificationsController],
  providers: [
    SocialEventsService,
    SocialGateway,
    FollowsService,
    ConversationsService,
    NotificationsService,
  ],
  exports: [FollowsService, NotificationsService, SocialEventsService],
})
export class SocialModule {}
