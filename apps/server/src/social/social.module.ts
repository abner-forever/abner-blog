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
import { SocialEventsService } from './social-events.service';
import { SocialGateway } from './social.gateway';
import { FollowsService } from './follows.service';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

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
