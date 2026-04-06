import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { UserNotification } from '../entities/user-notification.entity';
import { NotificationType } from '../entities/notification-type.enum';
import { SocialEventsService } from './social-events.service';
import { Comment } from '../entities/comment.entity';
import { Blog } from '../entities/blog.entity';
import { MomentComment } from '../entities/moment-comment.entity';
import { Moment } from '../entities/moment.entity';
import { NoteComment } from '../entities/note-comment.entity';
import { Note } from '../entities/note.entity';
import { User } from '../entities/user.entity';
import { SystemAnnouncement } from '../entities/system-announcement.entity';
import { sanitizeAnnouncementHtml } from './utils/sanitize-announcement-html';
import type { SystemAnnouncementPublicDto } from './dto/system-announcement-public.dto';

/** 通知中心展示的类型（不含私信，私信仅在会话列表查看） */
export const NOTIFICATION_FEED_TYPES: NotificationType[] = [
  NotificationType.COMMENT_BLOG,
  NotificationType.COMMENT_MOMENT,
  NotificationType.COMMENT_NOTE,
  NotificationType.SYSTEM,
];

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(UserNotification)
    private readonly notificationRepo: Repository<UserNotification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(NoteComment)
    private readonly noteCommentRepo: Repository<NoteComment>,
    @InjectRepository(SystemAnnouncement)
    private readonly systemAnnouncementRepo: Repository<SystemAnnouncement>,
    private readonly socialEvents: SocialEventsService,
  ) {}

  private announcementPlainSummary(announcement: SystemAnnouncement): string {
    return (
      announcement.bodyRich.replace(/<[^>]+>/g, '').slice(0, 200) ||
      announcement.title
    );
  }

  private buildAnnouncementUserPayload(
    announcement: SystemAnnouncement,
    options?: { recalled?: boolean },
  ): Record<string, unknown> {
    const recalled = options?.recalled === true;
    return {
      kind: 'system',
      announcementId: announcement.id,
      revision: announcement.notifyRevision,
      imageUrls: announcement.imageUrls ?? [],
      path: `/notifications/announcements/${announcement.id}`,
      recalled,
    };
  }

  /** C 端查看已发布公告全文（再次消毒输出）；撤回时仅返回标题与标记 */
  async getPublishedAnnouncement(
    id: number,
  ): Promise<SystemAnnouncementPublicDto> {
    // 仅按 id 查询，再在内存判断 published，避免部分 MySQL 驱动下
    // `where: { published: true }` 与 TINYINT 比较偶发不匹配导致误 404
    const row = await this.systemAnnouncementRepo.findOne({ where: { id } });
    if (!row?.published) {
      throw new NotFoundException('公告不存在或已下线');
    }
    if (row.recalledAt) {
      return {
        id: row.id,
        title: row.title,
        recalled: true,
        notifyRevision: row.notifyRevision,
        bodyRich: '',
        imageUrls: [],
        publishedAt: row.publishedAt,
        createdAt: row.createdAt,
      };
    }
    return {
      id: row.id,
      title: row.title,
      recalled: false,
      notifyRevision: row.notifyRevision,
      bodyRich: sanitizeAnnouncementHtml(row.bodyRich),
      imageUrls: row.imageUrls ?? [],
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
    };
  }

  /**
   * 将用户通知中心里该公告的条目标记为已撤回（不删行）
   */
  async bulkMarkRecalledForAnnouncement(
    announcementId: number,
  ): Promise<{ updated: number }> {
    const result = await this.notificationRepo
      .createQueryBuilder()
      .update(UserNotification)
      .set({
        payload: () => `JSON_SET(COALESCE(payload, '{}'), '$.recalled', true)`,
      })
      .where('type = :type', { type: NotificationType.SYSTEM })
      .andWhere(`JSON_EXTRACT(payload, '$.announcementId') = :aid`, {
        aid: announcementId,
      })
      .execute();
    return { updated: result.affected ?? 0 };
  }

  /**
   * 用当前公告内容覆盖所有相关用户通知，并给尚未收到该公告的用户补发。
   */
  async syncAnnouncementFeeds(announcement: SystemAnnouncement): Promise<{
    updated: number;
    created: number;
  }> {
    const title = announcement.title;
    const summary = this.announcementPlainSummary(announcement);
    const payload = this.buildAnnouncementUserPayload(announcement, {
      recalled: false,
    });
    const keys = await this.findAnnouncementNotificationKeys(announcement.id);
    const ids = keys.map((k) => k.id);
    const CHUNK = 200;
    let updated = 0;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      if (chunk.length === 0) continue;
      const r = await this.notificationRepo.update(
        { id: In(chunk) },
        { title, summary, payload },
      );
      updated += r.affected ?? 0;
    }
    const haveUsers = new Set(keys.map((k) => k.userId));
    const allUsers = await this.userRepo.find({ select: ['id'] });
    let created = 0;
    for (const u of allUsers) {
      if (!haveUsers.has(u.id)) {
        await this.saveAndEmit(u.id, {
          type: NotificationType.SYSTEM,
          title,
          summary,
          payload,
        });
        created += 1;
      }
    }
    return { updated, created };
  }

  private async findAnnouncementNotificationKeys(
    announcementId: number,
  ): Promise<Array<{ id: number; userId: number }>> {
    const table = this.notificationRepo.metadata.tableName;
    const rows: Array<{ id: number; userId: number }> =
      await this.notificationRepo.manager.query(
        `SELECT id, userId FROM \`${table}\` WHERE type = ? AND JSON_EXTRACT(payload, '$.announcementId') = ?`,
        [NotificationType.SYSTEM, announcementId],
      );
    return rows.map((r) => ({
      id: Number(r.id),
      userId: Number(r.userId),
    }));
  }

  async listForUser(
    userId: number,
    page = 1,
    pageSize = 20,
  ): Promise<{
    list: Array<{
      id: number;
      type: NotificationType;
      title: string;
      summary: string;
      payload: Record<string, unknown> | null;
      readAt: Date | null;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.notificationRepo.findAndCount({
      where: { recipient: { id: userId }, type: In(NOTIFICATION_FEED_TYPES) },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });
    return {
      list: rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        summary: r.summary,
        payload: r.payload,
        readAt: r.readAt,
        createdAt: r.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async countFeedUnread(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: {
        recipient: { id: userId },
        type: In(NOTIFICATION_FEED_TYPES),
        readAt: IsNull(),
      },
    });
  }

  async deleteNotification(
    userId: number,
    notificationId: number,
  ): Promise<{ deleted: number }> {
    const result = await this.notificationRepo.delete({
      id: notificationId,
      recipient: { id: userId },
    });
    return { deleted: result.affected ?? 0 };
  }

  async markRead(
    userId: number,
    ids: number[] | undefined,
    markAll: boolean,
  ): Promise<{ updated: number }> {
    if (markAll) {
      const res = await this.notificationRepo
        .createQueryBuilder()
        .update(UserNotification)
        .set({ readAt: new Date() })
        .where('userId = :userId', { userId })
        .andWhere('readAt IS NULL')
        .andWhere('type IN (:...types)', { types: NOTIFICATION_FEED_TYPES })
        .execute();
      return { updated: res.affected ?? 0 };
    }
    if (!ids?.length) {
      return { updated: 0 };
    }
    const res = await this.notificationRepo.update(
      { id: In(ids), recipient: { id: userId } },
      { readAt: new Date() },
    );
    return { updated: res.affected ?? 0 };
  }

  private async saveAndEmit(
    recipientId: number,
    row: Pick<UserNotification, 'type' | 'title' | 'summary' | 'payload'>,
  ): Promise<void> {
    const entity = this.notificationRepo.create({
      recipient: { id: recipientId },
      type: row.type,
      title: row.title,
      summary: row.summary,
      payload: row.payload,
    });
    const saved = await this.notificationRepo.save(entity);
    this.socialEvents.emitToUser(recipientId, 'notification:new', {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      summary: saved.summary,
      payload: saved.payload,
      createdAt: saved.createdAt,
    });
  }

  private dedupeIds(ids: number[], actorId: number): number[] {
    return [...new Set(ids.filter((id) => id && id !== actorId))];
  }

  private displayName(u: {
    nickname?: string | null;
    username: string;
  }): string {
    const n = u.nickname?.trim();
    return n || u.username;
  }

  private truncateText(s: string, max: number): string {
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > max ? `${t.slice(0, max)}…` : t;
  }

  async notifyBlogComment(params: {
    comment: Comment;
    blog: Blog;
    actorUserId: number;
  }): Promise<void> {
    const { comment, blog, actorUserId } = params;
    const actor = await this.userRepo.findOne({ where: { id: actorUserId } });
    if (!actor) return;
    const actorName = this.displayName(actor);
    const recipients: number[] = [];
    if (blog.author?.id) {
      recipients.push(blog.author.id);
    }
    if (comment.replyToUser?.id) {
      recipients.push(comment.replyToUser.id);
    } else if (comment.parentComment?.author?.id) {
      recipients.push(comment.parentComment.author.id);
    }
    const targetIds = this.dedupeIds(recipients, actorUserId);
    const blogTitle = this.truncateText(blog.title, 80);
    const excerpt = this.truncateText(comment.content, 120);
    const isReply = !!(comment.replyToUser || comment.parentComment);
    let replyTargetName: string | undefined;
    if (comment.replyToUser) {
      replyTargetName = this.displayName(comment.replyToUser);
    } else if (comment.parentComment?.author) {
      replyTargetName = this.displayName(comment.parentComment.author);
    }
    const parentSnippet = comment.parentComment?.content
      ? this.truncateText(comment.parentComment.content, 100)
      : undefined;
    const title =
      isReply && replyTargetName
        ? `${actorName} 回复了 ${replyTargetName}`
        : `${actorName} 评论了你的文章`;
    let summary = `《${blogTitle}》 ${excerpt}`;
    if (isReply && parentSnippet) {
      summary += ` · 原评论：${parentSnippet}`;
    }
    const payload: Record<string, unknown> = {
      kind: 'blog_comment',
      blogId: blog.id,
      commentId: comment.id,
      path: `/blogs/${blog.id}`,
      actorDisplayName: actorName,
      targetTitle: blogTitle,
      commentPreview: excerpt,
      threadType: isReply ? 'reply' : 'comment',
      replyToDisplayName: replyTargetName ?? null,
      parentCommentPreview: parentSnippet ?? null,
    };
    for (const uid of targetIds) {
      await this.saveAndEmit(uid, {
        type: NotificationType.COMMENT_BLOG,
        title,
        summary,
        payload,
      });
    }
  }

  async notifyMomentComment(params: {
    comment: MomentComment;
    moment: Moment;
    actorUserId: number;
  }): Promise<void> {
    const { comment, moment, actorUserId } = params;
    const actor = await this.userRepo.findOne({ where: { id: actorUserId } });
    if (!actor) return;
    const actorName = this.displayName(actor);
    const recipients: number[] = [];
    if (moment.author?.id) {
      recipients.push(moment.author.id);
    }
    if (comment.replyToUser?.id) {
      recipients.push(comment.replyToUser.id);
    } else if (comment.parentComment?.author?.id) {
      recipients.push(comment.parentComment.author.id);
    }
    const targetIds = this.dedupeIds(recipients, actorUserId);
    const momentTitle = this.truncateText(moment.content, 80);
    const excerpt = this.truncateText(comment.content, 120);
    const isReply = !!(comment.replyToUser || comment.parentComment);
    let replyTargetName: string | undefined;
    if (comment.replyToUser) {
      replyTargetName = this.displayName(comment.replyToUser);
    } else if (comment.parentComment?.author) {
      replyTargetName = this.displayName(comment.parentComment.author);
    }
    const parentSnippet = comment.parentComment?.content
      ? this.truncateText(comment.parentComment.content, 100)
      : undefined;
    const title =
      isReply && replyTargetName
        ? `${actorName} 回复了 ${replyTargetName}`
        : `${actorName} 评论了你的动态`;
    let summary = `「${momentTitle}」 ${excerpt}`;
    if (isReply && parentSnippet) {
      summary += ` · 原评论：${parentSnippet}`;
    }
    const payload: Record<string, unknown> = {
      kind: 'moment_comment',
      momentId: moment.id,
      commentId: comment.id,
      path: `/moments/${moment.id}`,
      actorDisplayName: actorName,
      targetTitle: momentTitle,
      commentPreview: excerpt,
      threadType: isReply ? 'reply' : 'comment',
      replyToDisplayName: replyTargetName ?? null,
      parentCommentPreview: parentSnippet ?? null,
    };
    for (const uid of targetIds) {
      await this.saveAndEmit(uid, {
        type: NotificationType.COMMENT_MOMENT,
        title,
        summary,
        payload,
      });
    }
  }

  async notifyNoteComment(params: {
    comment: NoteComment;
    note: Note;
    actorUserId: number;
  }): Promise<void> {
    const { comment, note, actorUserId } = params;
    const actor = await this.userRepo.findOne({ where: { id: actorUserId } });
    if (!actor) return;
    const actorName = this.displayName(actor);
    const recipients: number[] = [];
    if (note.author?.id) {
      recipients.push(note.author.id);
    }
    if (comment.replyToUser?.id) {
      recipients.push(comment.replyToUser.id);
    }
    let parentSnippet: string | undefined;
    let parentAuthorForReply: {
      nickname?: string | null;
      username: string;
    } | null = null;
    if (comment.parentId) {
      const parent = await this.noteCommentRepo.findOne({
        where: { id: comment.parentId },
        relations: { author: true },
      });
      if (parent?.author?.id) {
        recipients.push(parent.author.id);
      }
      if (parent?.content) {
        parentSnippet = this.truncateText(parent.content, 100);
      }
      if (parent?.author) {
        parentAuthorForReply = parent.author;
      }
    }
    const targetIds = this.dedupeIds(recipients, actorUserId);
    const noteTitle = this.truncateText(
      (note.title && note.title.trim()) || note.content,
      80,
    );
    const excerpt = this.truncateText(comment.content, 120);
    const isReply = !!(comment.replyToUser || comment.parentId);
    let replyTargetName: string | undefined;
    if (comment.replyToUser) {
      replyTargetName = this.displayName(comment.replyToUser);
    } else if (parentAuthorForReply) {
      replyTargetName = this.displayName(parentAuthorForReply);
    }
    const title =
      isReply && replyTargetName
        ? `${actorName} 回复了 ${replyTargetName}`
        : `${actorName} 评论了你的笔记`;
    let summary = `《${noteTitle}》 ${excerpt}`;
    if (isReply && parentSnippet) {
      summary += ` · 原评论：${parentSnippet}`;
    }
    const payload: Record<string, unknown> = {
      kind: 'note_comment',
      noteId: note.id,
      commentId: comment.id,
      path: `/notes/${note.id}`,
      actorDisplayName: actorName,
      targetTitle: noteTitle,
      commentPreview: excerpt,
      threadType: isReply ? 'reply' : 'comment',
      replyToDisplayName: replyTargetName ?? null,
      parentCommentPreview: parentSnippet ?? null,
    };
    for (const uid of targetIds) {
      await this.saveAndEmit(uid, {
        type: NotificationType.COMMENT_NOTE,
        title,
        summary,
        payload,
      });
    }
  }

  async notifyDirectMessage(params: {
    recipientId: number;
    senderId: number;
    conversationId: number;
    messageId: number;
    preview: string;
    senderNickname: string | null;
    senderUsername: string;
  }): Promise<void> {
    const {
      recipientId,
      senderId,
      conversationId,
      messageId,
      preview,
      senderNickname,
      senderUsername,
    } = params;
    if (recipientId === senderId) return;
    const displayName = senderNickname || senderUsername;
    await this.saveAndEmit(recipientId, {
      type: NotificationType.DIRECT_MESSAGE,
      title: `${displayName} 发来私信`,
      summary: preview.length > 120 ? `${preview.slice(0, 120)}…` : preview,
      payload: {
        kind: 'direct_message',
        conversationId,
        messageId,
        senderId,
        path: '/messages',
      },
    });
  }

  async createForAllUsersFromAnnouncement(
    announcement: SystemAnnouncement,
  ): Promise<{ created: number }> {
    const users = await this.userRepo.find({ select: ['id'] });
    const title = announcement.title;
    const summary = this.announcementPlainSummary(announcement);
    const payload = this.buildAnnouncementUserPayload(announcement, {
      recalled: false,
    });
    let created = 0;
    for (const u of users) {
      await this.saveAndEmit(u.id, {
        type: NotificationType.SYSTEM,
        title,
        summary,
        payload,
      });
      created += 1;
    }
    return { created };
  }
}
