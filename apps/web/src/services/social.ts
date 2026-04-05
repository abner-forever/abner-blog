import { httpMutator } from './http';

export type NotificationType =
  | 'COMMENT_BLOG'
  | 'COMMENT_MOMENT'
  | 'COMMENT_NOTE'
  | 'SYSTEM'
  | 'DIRECT_MESSAGE';

export interface FollowStatusDto {
  following: boolean;
  followedBy: boolean;
}

export interface ConversationListItem {
  id: number;
  peer: {
    id: number;
    username: string;
    nickname: string | null;
    avatar: string | null;
  };
  lastMessage: {
    id: number;
    content: string;
    senderId: number;
    createdAt: string;
  } | null;
  /** 当前用户在该会话未读的对方消息条数 */
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationsListResponse {
  list: ConversationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DirectMessageItem {
  id: number;
  content: string;
  attachments: string[] | null;
  senderId: number;
  createdAt: string;
}

export interface MessagesListResponse {
  list: DirectMessageItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  summary: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  list: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 已发布系统公告详情（GET /notifications/announcements/:id） */
export interface SystemAnnouncementPublic {
  id: number;
  title: string;
  /** 管理端撤回后为 true，无正文 */
  recalled?: boolean;
  /** 推送版本，>1 表示曾重新推送 */
  notifyRevision?: number;
  bodyRich: string;
  imageUrls: string[];
  publishedAt: string | null;
  createdAt: string;
}

export const followUser = (userId: number) =>
  httpMutator<{ following: boolean }>({
    url: `/api/users/${userId}/follow`,
    method: 'POST',
  });

export const unfollowUser = (userId: number) =>
  httpMutator<{ following: boolean }>({
    url: `/api/users/${userId}/follow`,
    method: 'DELETE',
  });

export const getFollowStatus = (userId: number) =>
  httpMutator<FollowStatusDto>({
    url: `/api/users/${userId}/follow-status`,
    method: 'GET',
  });

export const openConversation = (peerUserId: number) =>
  httpMutator<{
    id: number;
    peer: ConversationListItem['peer'];
  }>({
    url: '/api/conversations/open',
    method: 'POST',
    data: { peerUserId },
    headers: { 'Content-Type': 'application/json' },
  });

export const getConversations = (page = 1, pageSize = 20) =>
  httpMutator<ConversationsListResponse>({
    url: '/api/conversations',
    method: 'GET',
    params: { page, pageSize },
  });

export const getConversationMessages = (
  conversationId: number,
  page = 1,
  pageSize = 30,
) =>
  httpMutator<MessagesListResponse>({
    url: `/api/conversations/${conversationId}/messages`,
    method: 'GET',
    params: { page, pageSize },
  });

export const sendDirectMessage = (
  conversationId: number,
  body: { content: string; attachments?: string[] },
) =>
  httpMutator<DirectMessageItem>({
    url: `/api/conversations/${conversationId}/messages`,
    method: 'POST',
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });

/** 将已读推进到某条消息（该条需在聊天可视区内展示过） */
export const markDmReadThrough = (
  conversationId: number,
  messageId: number,
) =>
  httpMutator<{ readThrough: string }>({
    url: `/api/conversations/${conversationId}/read-through`,
    method: 'POST',
    data: { messageId },
    headers: { 'Content-Type': 'application/json' },
  });

export const getNotifications = (page = 1, pageSize = 20) =>
  httpMutator<NotificationsListResponse>({
    url: '/api/notifications',
    method: 'GET',
    params: { page, pageSize },
  });

export const getSystemAnnouncement = (id: number) =>
  httpMutator<SystemAnnouncementPublic>({
    url: `/api/notifications/announcements/${id}`,
    method: 'GET',
  });

/** 通知中心未读（评论/系统，不含私信） */
export const getNotificationFeedUnreadCount = () =>
  httpMutator<{ feedUnread: number }>({
    url: '/api/notifications/unread-count',
    method: 'GET',
  });

/** 私信未读条数 */
export const getDmUnreadCount = () =>
  httpMutator<{ dmUnread: number }>({
    url: '/api/conversations/unread-count',
    method: 'GET',
  });

export const markNotificationsRead = (body: {
  ids?: number[];
  markAll?: boolean;
}) =>
  httpMutator<{ updated: number }>({
    url: '/api/notifications/read',
    method: 'POST',
    data: body,
    headers: { 'Content-Type': 'application/json' },
  });
