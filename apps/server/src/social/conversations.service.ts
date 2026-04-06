import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectConversation } from '../entities/direct-conversation.entity';
import { DirectMessage } from '../entities/direct-message.entity';
import { User } from '../entities/user.entity';
import { normalizeUserPair } from './utils/normalize-user-pair';
import { FollowsService } from './follows.service';
import { NotificationsService } from './notifications.service';
import { SocialEventsService } from './social-events.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(DirectConversation)
    private readonly convRepo: Repository<DirectConversation>,
    @InjectRepository(DirectMessage)
    private readonly messageRepo: Repository<DirectMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly followsService: FollowsService,
    private readonly notificationsService: NotificationsService,
    private readonly socialEvents: SocialEventsService,
  ) {}

  private getPeer(
    conv: DirectConversation,
    currentUserId: number,
  ): {
    id: number;
    username: string;
    nickname: string | null;
    avatar: string | null;
  } {
    const peer =
      conv.userLow.id === currentUserId ? conv.userHigh : conv.userLow;
    return {
      id: peer.id,
      username: peer.username,
      nickname: peer.nickname ?? null,
      avatar: peer.avatar ?? null,
    };
  }

  private getMyLastReadAt(conv: DirectConversation, userId: number): Date {
    const lowId = conv.userLow.id;
    return lowId === userId
      ? (conv.userLowLastReadAt ?? conv.createdAt)
      : (conv.userHighLastReadAt ?? conv.createdAt);
  }

  /** 当前用户在该会话中未读的对方消息条数 */
  private async countUnreadInConversation(
    conv: DirectConversation,
    userId: number,
  ): Promise<number> {
    const myLastRead = this.getMyLastReadAt(conv, userId);
    return this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :cid', { cid: conv.id })
      .andWhere('m.senderId != :uid', { uid: userId })
      .andWhere('m.createdAt > :lr', { lr: myLastRead })
      .getCount();
  }

  async openOrGetConversation(
    userId: number,
    peerUserId: number,
  ): Promise<{
    id: number;
    peer: {
      id: number;
      username: string;
      nickname: string | null;
      avatar: string | null;
    };
  }> {
    if (userId === peerUserId) {
      throw new ForbiddenException('不能与自己发起会话');
    }
    const peer = await this.userRepo.findOne({ where: { id: peerUserId } });
    if (!peer) {
      throw new NotFoundException('用户不存在');
    }
    const allowed = await this.followsService.hasFollowEdge(userId, peerUserId);
    if (!allowed) {
      throw new ForbiddenException('需存在关注关系后才能私信');
    }
    const [low, high] = normalizeUserPair(userId, peerUserId);
    let conv = await this.convRepo.findOne({
      where: {
        userLow: { id: low },
        userHigh: { id: high },
      },
      relations: { userLow: true, userHigh: true },
    });
    if (!conv) {
      const now = new Date();
      conv = this.convRepo.create({
        userLow: { id: low },
        userHigh: { id: high },
        userLowLastReadAt: now,
        userHighLastReadAt: now,
      });
      await this.convRepo.save(conv);
      conv = await this.convRepo.findOneOrFail({
        where: { id: conv.id },
        relations: { userLow: true, userHigh: true },
      });
    }
    return {
      id: conv.id,
      peer: this.getPeer(conv, userId),
    };
  }

  async listConversations(
    userId: number,
    page = 1,
    pageSize = 20,
  ): Promise<{
    list: Array<{
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
        createdAt: Date;
      } | null;
      unreadCount: number;
      updatedAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    const qb = this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userLow', 'userLow')
      .leftJoinAndSelect('c.userHigh', 'userHigh')
      .where('(c.userLowId = :userId OR c.userHighId = :userId)', { userId })
      .orderBy('c.updatedAt', 'DESC')
      .skip(skip)
      .take(pageSize);
    const [convs, total] = await qb.getManyAndCount();
    const list = await Promise.all(
      convs.map(async (c) => {
        const last = await this.messageRepo.findOne({
          where: { conversation: { id: c.id } },
          relations: { sender: true },
          order: { createdAt: 'DESC' },
        });
        const unreadCount = await this.countUnreadInConversation(c, userId);
        return {
          id: c.id,
          peer: this.getPeer(c, userId),
          lastMessage: last
            ? {
                id: last.id,
                content: last.content,
                senderId: last.sender.id,
                createdAt: last.createdAt,
              }
            : null,
          unreadCount,
          updatedAt: c.updatedAt,
        };
      }),
    );
    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  /**
   * 当前用户在各会话中「对方发来、且晚于本人 lastRead」的消息总数。
   */
  async countUnreadDmMessages(userId: number): Promise<number> {
    const convs = await this.convRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userLow', 'userLow')
      .leftJoinAndSelect('c.userHigh', 'userHigh')
      .where('userLow.id = :userId OR userHigh.id = :userId', { userId })
      .getMany();

    let total = 0;
    for (const c of convs) {
      total += await this.countUnreadInConversation(c, userId);
    }
    return total;
  }

  async assertParticipant(
    conversationId: number,
    userId: number,
  ): Promise<DirectConversation> {
    const conv = await this.convRepo.findOne({
      where: { id: conversationId },
      relations: { userLow: true, userHigh: true },
    });
    if (!conv) {
      throw new NotFoundException('会话不存在');
    }
    if (conv.userLow.id !== userId && conv.userHigh.id !== userId) {
      throw new ForbiddenException('无权访问该会话');
    }
    return conv;
  }

  /**
   * 将当前用户在该会话的已读游标推进到「某条消息的发送时间」（仅当不早于当前游标）。
   * 已读以客户端可视区域为准，不在 listMessages 拉取时自动整页标已读。
   */
  async markReadThroughMessage(
    conversationId: number,
    userId: number,
    messageId: number,
  ): Promise<{ readThrough: Date }> {
    const conv = await this.assertParticipant(conversationId, userId);
    const msg = await this.messageRepo.findOne({
      where: { id: messageId, conversation: { id: conversationId } },
    });
    if (!msg) {
      throw new NotFoundException('消息不存在');
    }
    const current = this.getMyLastReadAt(conv, userId);
    if (msg.createdAt.getTime() <= current.getTime()) {
      return { readThrough: current };
    }
    if (conv.userLow.id === userId) {
      await this.convRepo.update(
        { id: conversationId },
        { userLowLastReadAt: msg.createdAt },
      );
    } else {
      await this.convRepo.update(
        { id: conversationId },
        { userHighLastReadAt: msg.createdAt },
      );
    }
    return { readThrough: msg.createdAt };
  }

  async listMessages(
    conversationId: number,
    userId: number,
    page = 1,
    pageSize = 30,
  ): Promise<{
    list: Array<{
      id: number;
      content: string;
      attachments: string[] | null;
      senderId: number;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    await this.assertParticipant(conversationId, userId);
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.messageRepo.findAndCount({
      where: { conversation: { id: conversationId } },
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });
    return {
      list: rows.map((m) => ({
        id: m.id,
        content: m.content,
        attachments: m.attachments ?? null,
        senderId: m.sender.id,
        createdAt: m.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
    attachments?: string[] | null,
  ): Promise<{
    id: number;
    content: string;
    attachments: string[] | null;
    senderId: number;
    createdAt: Date;
  }> {
    const conv = await this.assertParticipant(conversationId, senderId);
    const peerId =
      conv.userLow.id === senderId ? conv.userHigh.id : conv.userLow.id;
    const edgeOk = await this.followsService.hasFollowEdge(senderId, peerId);
    if (!edgeOk) {
      throw new ForbiddenException('需存在关注关系后才能私信');
    }
    const trimmed = content.trim();
    if (!trimmed && !attachments?.length) {
      throw new ForbiddenException('消息内容不能为空');
    }
    const msg = this.messageRepo.create({
      conversation: { id: conversationId },
      sender: { id: senderId },
      content: trimmed || ' ',
      attachments: attachments?.length ? attachments : null,
    });
    const saved = await this.messageRepo.save(msg);
    conv.updatedAt = new Date();
    await this.convRepo.save(conv);

    const sender = await this.userRepo.findOneOrFail({
      where: { id: senderId },
    });

    const preview = trimmed || '[图片]';
    await this.notificationsService.notifyDirectMessage({
      recipientId: peerId,
      senderId,
      conversationId,
      messageId: saved.id,
      preview,
      senderNickname: sender.nickname ?? null,
      senderUsername: sender.username,
    });

    this.socialEvents.emitToUser(peerId, 'direct_message:new', {
      conversationId,
      message: {
        id: saved.id,
        content: saved.content,
        attachments: saved.attachments,
        senderId,
        createdAt: saved.createdAt,
      },
    });

    return {
      id: saved.id,
      content: saved.content,
      attachments: saved.attachments ?? null,
      senderId,
      createdAt: saved.createdAt,
    };
  }

  async deleteConversation(
    userId: number,
    conversationId: number,
  ): Promise<{ deleted: number }> {
    await this.assertParticipant(conversationId, userId);
    const result = await this.convRepo.delete({ id: conversationId });
    return { deleted: result.affected ?? 0 };
  }
}
