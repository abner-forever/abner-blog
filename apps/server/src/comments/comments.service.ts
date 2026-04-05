import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponse } from './interfaces/comment-response.interface';
import { CommentLike } from '../entities/comment-like.entity';
import { NotificationsService } from '../social/notifications.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private commentLikesRepository: Repository<CommentLike>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: number,
    blogId: number,
  ): Promise<Comment> {
    let parentComment: Comment | undefined;
    if (createCommentDto.parentId) {
      const foundParentComment = await this.commentsRepository.findOne({
        where: { id: createCommentDto.parentId, blog: { id: blogId } },
        relations: { author: true },
      });
      if (!foundParentComment) {
        throw new NotFoundException('回复的评论不存在');
      }
      parentComment = foundParentComment;
    }

    const comment = this.commentsRepository.create({
      content: createCommentDto.content,
      author: { id: userId },
      blog: { id: blogId },
      parentComment,
      replyToUser: createCommentDto.replyToUserId
        ? { id: createCommentDto.replyToUserId }
        : parentComment
          ? { id: parentComment.author.id }
          : undefined,
    });
    const saved = await this.commentsRepository.save(comment);
    // 使用 QueryBuilder 显式 join blog.author，避免 find relations 嵌套在部分 TypeORM/MySQL 配置下未加载作者
    const full = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.blog', 'blog')
      .leftJoinAndSelect('blog.author', 'blogAuthor')
      .leftJoinAndSelect('comment.author', 'commentAuthor')
      .leftJoinAndSelect('comment.parentComment', 'parentComment')
      .leftJoinAndSelect('parentComment.author', 'parentAuthor')
      .leftJoinAndSelect('comment.replyToUser', 'replyToUser')
      .where('comment.id = :id', { id: saved.id })
      .getOne();
    if (full?.blog?.author) {
      try {
        await this.notificationsService.notifyBlogComment({
          comment: full,
          blog: full.blog,
          actorUserId: userId,
        });
      } catch (err) {
        this.logger.warn(
          `评论通知失败 commentId=${saved.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } else if (full) {
      this.logger.warn(
        `评论已保存但未找到博客作者，跳过通知 commentId=${saved.id} blogId=${full.blog?.id}`,
      );
    }
    return saved;
  }

  async findAll(blogId: number, userId?: number): Promise<CommentResponse[]> {
    const comments = await this.commentsRepository.find({
      where: { blog: { id: blogId } },
      relations: {
        author: true,
        blog: true,
        parentComment: true,
        replyToUser: true,
      },
      order: { createdAt: 'DESC' },
    });

    const commentIds = comments.map((comment) => comment.id);
    const likeMap = new Map<number, boolean>();
    if (userId && commentIds.length > 0) {
      const likedComments = await this.commentLikesRepository
        .createQueryBuilder('commentLike')
        .select('commentLike.commentId', 'commentId')
        .where('commentLike.commentId IN (:...commentIds)', { commentIds })
        .andWhere('commentLike.userId = :userId', { userId })
        .getRawMany<{ commentId: number }>();
      likedComments.forEach((item) => likeMap.set(item.commentId, true));
    }

    return comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isEdited: comment.isEdited,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        nickname: comment.author.nickname,
        avatar: comment.author.avatar,
      },
      likeCount: comment.likeCount || 0,
      isLiked: likeMap.get(comment.id) || false,
      parentComment: comment.parentComment
        ? {
            id: comment.parentComment.id,
          }
        : undefined,
      replyToUser: comment.replyToUser
        ? {
            id: comment.replyToUser.id,
            username: comment.replyToUser.username,
            nickname: comment.replyToUser.nickname || null,
          }
        : undefined,
      blog: {
        id: comment.blog.id,
        title: comment.blog.title,
      },
    }));
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['author', 'blog'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  async update(
    id: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.author.id !== userId) {
      throw new ForbiddenException('您没有权限修改此评论');
    }

    Object.assign(comment, updateCommentDto);
    comment.isEdited = true;
    return this.commentsRepository.save(comment);
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.findOne(id);

    if (comment.author.id !== userId) {
      throw new ForbiddenException('您没有权限删除此评论');
    }

    await this.commentsRepository.remove(comment);
  }

  async toggleLike(
    commentId: number,
    userId: number,
  ): Promise<{ isLiked: boolean }> {
    const comment = await this.findOne(commentId);
    const existingLike = await this.commentLikesRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.commentLikesRepository.remove(existingLike);
      await this.commentsRepository.decrement(
        { id: comment.id },
        'likeCount',
        1,
      );
      return { isLiked: false };
    }

    const like = this.commentLikesRepository.create({
      comment: { id: commentId },
      user: { id: userId },
    });
    await this.commentLikesRepository.save(like);
    await this.commentsRepository.increment({ id: comment.id }, 'likeCount', 1);
    return { isLiked: true };
  }
}
