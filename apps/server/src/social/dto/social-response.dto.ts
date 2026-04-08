import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../entities/notification-type.enum';

export class FollowUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true, required: false })
  nickname: string | null;

  @ApiProperty({ nullable: true, required: false })
  avatar: string | null;

  @ApiProperty()
  followedAt: Date;
}

export class FollowListResponseDto {
  @ApiProperty({ type: [FollowUserDto] })
  list: FollowUserDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class FollowStatusResponseDto {
  @ApiProperty()
  following: boolean;

  @ApiProperty()
  followedBy: boolean;
}

export class DmUnreadCountResponseDto {
  @ApiProperty()
  dmUnread: number;
}

class ConversationPeerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true, required: false })
  nickname: string | null;

  @ApiProperty({ nullable: true, required: false })
  avatar: string | null;
}

class ConversationLastMessageDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  senderId: number;

  @ApiProperty()
  createdAt: Date;
}

export class ConversationDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: ConversationPeerDto })
  peer: ConversationPeerDto;

  @ApiProperty({
    type: ConversationLastMessageDto,
    nullable: true,
    required: false,
  })
  lastMessage: ConversationLastMessageDto | null;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  updatedAt: Date;
}

export class ConversationListResponseDto {
  @ApiProperty({ type: [ConversationDto] })
  list: ConversationDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class OpenConversationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: ConversationPeerDto })
  peer: ConversationPeerDto;
}

export class MarkReadThroughResponseDto {
  @ApiProperty()
  readThrough: Date;
}

export class DirectMessageDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String], nullable: true, required: false })
  attachments: string[] | null;

  @ApiProperty()
  senderId: number;

  @ApiProperty()
  createdAt: Date;
}

export class DirectMessageListResponseDto {
  @ApiProperty({ type: [DirectMessageDto] })
  list: DirectMessageDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class DeletedCountResponseDto {
  @ApiProperty()
  deleted: number;
}

export class NotificationUnreadCountResponseDto {
  @ApiProperty()
  feedUnread: number;
}

export class NotificationItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ nullable: true, required: false, type: Object })
  payload: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, required: false })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationItemDto] })
  list: NotificationItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class UpdatedCountResponseDto {
  @ApiProperty()
  updated: number;
}
