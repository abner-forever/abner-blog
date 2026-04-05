import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, FindOptionsWhere } from 'typeorm';
import { Moment } from '../entities/moment.entity';
import { MomentComment } from '../entities/moment-comment.entity';
import { MomentLike } from '../entities/moment-like.entity';
import { MomentFavorite } from '../entities/moment-favorite.entity';
import { MomentViewLog } from '../entities/moment-view-log.entity';
import { Topic } from '../entities/topic.entity';
import { CreateMomentDto } from './dto/create-moment.dto';
import { SearchMomentDto } from './dto/search-moment.dto';
import { CreateMomentCommentDto } from './dto/create-moment-comment.dto';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { MomentCommentLike } from '../entities/moment-comment-like.entity';
import { NotificationsService } from '../social/notifications.service';

/**
 * 获取北京时间的日期字符串 (YYYY-MM-DD)
 */
function getBeijingDateStr(date: Date = new Date()): string {
  const beijingOffset = 8 * 60;
  const localOffset = date.getTimezoneOffset();
  const beijingTime = new Date(
    date.getTime() + (localOffset + beijingOffset) * 60 * 1000,
  );
  return beijingTime.toISOString().split('T')[0];
}

interface MomentIdResult {
  momentId: number;
}

export interface MomentItem {
  id: number;
  content: string;
  images: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  };
  topic: {
    id: number;
    name: string;
  };
  isLiked: boolean;
  isFavorited: boolean;
}

export type MomentDetail = Omit<MomentItem, 'isLiked' | 'isFavorited'> & {
  isLiked: boolean;
  isFavorited: boolean;
};

export type FavoriteMomentItem = Omit<MomentItem, 'isLiked' | 'isFavorited'> & {
  favoriteId: number;
  favoritedAt: Date;
};

@Injectable()
export class MomentsService {
  constructor(
    @InjectRepository(Moment)
    private momentsRepository: Repository<Moment>,
    @InjectRepository(MomentComment)
    private momentCommentsRepository: Repository<MomentComment>,
    @InjectRepository(MomentLike)
    private momentLikesRepository: Repository<MomentLike>,
    @InjectRepository(MomentFavorite)
    private momentFavoritesRepository: Repository<MomentFavorite>,
    @InjectRepository(MomentViewLog)
    private momentViewLogsRepository: Repository<MomentViewLog>,
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
    @InjectRepository(MomentCommentLike)
    private momentCommentLikesRepository: Repository<MomentCommentLike>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private serializeAuthor(author: Moment['author']): MomentItem['author'] {
    return {
      id: author.id,
      username: author.username,
      nickname: author.nickname,
      avatar: author.avatar,
    };
  }

  private serializeMomentWithSafeAuthor<T extends Moment>(
    moment: T,
  ): Omit<T, 'author'> & { author: MomentItem['author'] } {
    return {
      ...moment,
      author: this.serializeAuthor(moment.author),
    };
  }

  async create(
    createMomentDto: CreateMomentDto,
    userId: number,
  ): Promise<Moment> {
    const moment = this.momentsRepository.create({
      ...createMomentDto,
      author: { id: userId },
      topic: createMomentDto.topicId
        ? { id: createMomentDto.topicId }
        : undefined,
    });

    const savedMoment = await this.momentsRepository.save(moment);

    // 更新话题的沸点数量
    if (createMomentDto.topicId) {
      await this.topicsRepository.increment(
        { id: createMomentDto.topicId },
        'momentCount',
        1,
      );
    }

    return savedMoment;
  }

  async findAll(
    searchDto: SearchMomentDto,
    userId?: number,
  ): Promise<PaginatedResponse<MomentItem>> {
    const {
      page = 1,
      pageSize = 10,
      search,
      topicId,
      sortBy = 'time',
    } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.momentsRepository
      .createQueryBuilder('moment')
      .leftJoinAndSelect('moment.author', 'author')
      .leftJoinAndSelect('moment.topic', 'topic')
      .select([
        'moment.id',
        'moment.content',
        'moment.images',
        'moment.viewCount',
        'moment.likeCount',
        'moment.commentCount',
        'moment.favoriteCount',
        'moment.createdAt',
        'moment.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'author.avatar',
        'topic.id',
        'topic.name',
      ]);

    if (search) {
      queryBuilder.where('moment.content LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (topicId) {
      queryBuilder.andWhere('moment.topic.id = :topicId', { topicId });
    }

    // 排序
    if (sortBy === 'hot') {
      // 热度排序：点赞数 * 3 + 评论数 * 2 + 收藏数 * 2 + 浏览数 / 10
      queryBuilder.orderBy(
        'moment.likeCount * 3 + moment.commentCount * 2 + moment.favoriteCount * 2 + moment.viewCount / 10',
        'DESC',
      );
    } else {
      queryBuilder.orderBy('moment.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    if (list.length === 0) {
      return {
        list: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const momentIds = list.map((moment) => moment.id);

    // 批量检查用户点赞和收藏状态
    let userLikesMap = new Map<number, boolean>();
    let userFavoritesMap = new Map<number, boolean>();
    if (userId) {
      const userLikes = await this.momentLikesRepository
        .createQueryBuilder('like')
        .innerJoin('like.moment', 'moment')
        .innerJoin('like.user', 'user')
        .select('moment.id', 'momentId')
        .where('moment.id IN (:...momentIds)', { momentIds })
        .andWhere('user.id = :userId', { userId })
        .getRawMany();

      const userFavorites = await this.momentFavoritesRepository
        .createQueryBuilder('favorite')
        .innerJoin('favorite.moment', 'moment')
        .innerJoin('favorite.user', 'user')
        .select('moment.id', 'momentId')
        .where('moment.id IN (:...momentIds)', { momentIds })
        .andWhere('user.id = :userId', { userId })
        .getRawMany();

      userLikesMap = new Map(
        userLikes.map((item: MomentIdResult) => [item.momentId, true]),
      );
      userFavoritesMap = new Map(
        userFavorites.map((item: MomentIdResult) => [item.momentId, true]),
      );
    }

    const enrichedList = list.map((moment) => ({
      ...moment,
      isLiked: userLikesMap.get(moment.id) || false,
      isFavorited: userFavoritesMap.get(moment.id) || false,
    }));

    return {
      list: enrichedList,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(
    id: number,
    userId?: number,
    ip?: string,
  ): Promise<MomentDetail> {
    const moment = await this.momentsRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });

    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }

    // 防重复浏览：同一用户/IP 每天只算一次
    const today = getBeijingDateStr();
    const effectiveIp = ip || 'anonymous';
    const whereCondition: FindOptionsWhere<MomentViewLog> = {
      momentId: id,
      viewDate: today,
    };

    if (userId) {
      whereCondition.userId = userId;
    } else {
      whereCondition.ip = effectiveIp;
      whereCondition.userId = IsNull();
    }

    const existingLog = await this.momentViewLogsRepository.findOne({
      where: whereCondition,
    });

    if (!existingLog) {
      try {
        const newLog = this.momentViewLogsRepository.create({
          momentId: id,
          userId: userId || undefined,
          ip: userId ? undefined : effectiveIp,
          viewDate: today,
        });
        await this.momentViewLogsRepository.save(newLog);
        await this.momentsRepository.increment({ id }, 'viewCount', 1);
        moment.viewCount++;
      } catch (e) {
        // 忽略并发冲突（唯一索引会报错）
        console.error('记录闲聊浏览量失败:', e);
      }
    }

    // 检查用户点赞和收藏状态
    let isLiked = false;
    let isFavorited = false;
    if (userId) {
      const [likeExists, favoriteExists] = await Promise.all([
        this.momentLikesRepository.findOne({
          where: { moment: { id }, user: { id: userId } },
        }),
        this.momentFavoritesRepository.findOne({
          where: { moment: { id }, user: { id: userId } },
        }),
      ]);
      isLiked = !!likeExists;
      isFavorited = !!favoriteExists;
    }

    return {
      ...this.serializeMomentWithSafeAuthor(moment),
      isLiked,
      isFavorited,
    };
  }

  async remove(id: number, userId: number): Promise<void> {
    const moment = await this.momentsRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });

    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }

    if (moment.author.id !== userId) {
      throw new ForbiddenException('无权删除此沸点');
    }

    // 更新话题的沸点数量
    if (moment.topic) {
      await this.topicsRepository.decrement(
        { id: moment.topic.id },
        'momentCount',
        1,
      );
    }

    // 先删除评论的点赞记录（避免外键约束报错）
    const comments = await this.momentCommentsRepository.find({
      where: { moment: { id } },
      select: ['id'],
    });
    if (comments.length > 0) {
      await this.momentCommentLikesRepository.delete({
        comment: { id: In(comments.map((c) => c.id)) },
      });
    }

    // 再删除沸点级别的点赞、评论、收藏记录
    await Promise.all([
      this.momentLikesRepository.delete({ moment: { id } }),
      this.momentCommentsRepository.delete({ moment: { id } }),
      this.momentFavoritesRepository.delete({ moment: { id } }),
    ]);

    await this.momentsRepository.remove(moment);
  }

  async update(
    id: number,
    updateMomentDto: UpdateMomentDto,
    userId: number,
  ): Promise<Moment> {
    const moment = await this.momentsRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });
    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }
    if (moment.author.id !== userId) {
      throw new ForbiddenException('无权编辑此沸点');
    }

    const oldTopicId = moment.topic?.id;
    const nextTopicId = updateMomentDto.topicId;
    if (typeof nextTopicId === 'number' && nextTopicId !== oldTopicId) {
      if (oldTopicId) {
        await this.topicsRepository.decrement(
          { id: oldTopicId },
          'momentCount',
          1,
        );
      }
      await this.topicsRepository.increment(
        { id: nextTopicId },
        'momentCount',
        1,
      );
      moment.topic = { id: nextTopicId } as Topic;
    } else if (nextTopicId === undefined) {
      // 保持原话题不变
    }

    if (typeof updateMomentDto.content === 'string') {
      moment.content = updateMomentDto.content;
    }
    if (Array.isArray(updateMomentDto.images)) {
      moment.images = updateMomentDto.images;
    }

    return this.momentsRepository.save(moment);
  }

  // 点赞/取消点赞
  async toggleLike(
    momentId: number,
    userId: number,
  ): Promise<{ isLiked: boolean }> {
    const moment = await this.momentsRepository.findOne({
      where: { id: momentId },
    });

    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }

    const existingLike = await this.momentLikesRepository.findOne({
      where: { moment: { id: momentId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.momentLikesRepository.remove(existingLike);
      await this.momentsRepository.decrement({ id: momentId }, 'likeCount', 1);
      return { isLiked: false };
    } else {
      const like = this.momentLikesRepository.create({
        moment: { id: momentId },
        user: { id: userId },
      });
      await this.momentLikesRepository.save(like);
      await this.momentsRepository.increment({ id: momentId }, 'likeCount', 1);
      return { isLiked: true };
    }
  }

  // 收藏/取消收藏
  async toggleFavorite(
    momentId: number,
    userId: number,
  ): Promise<{ isFavorited: boolean }> {
    const moment = await this.momentsRepository.findOne({
      where: { id: momentId },
    });

    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }

    const existingFavorite = await this.momentFavoritesRepository.findOne({
      where: { moment: { id: momentId }, user: { id: userId } },
    });

    if (existingFavorite) {
      await this.momentFavoritesRepository.remove(existingFavorite);
      await this.momentsRepository.decrement(
        { id: momentId },
        'favoriteCount',
        1,
      );
      return { isFavorited: false };
    } else {
      const favorite = this.momentFavoritesRepository.create({
        moment: { id: momentId },
        user: { id: userId },
      });
      await this.momentFavoritesRepository.save(favorite);
      await this.momentsRepository.increment(
        { id: momentId },
        'favoriteCount',
        1,
      );
      return { isFavorited: true };
    }
  }

  // 获取沸点评论列表
  async getComments(
    momentId: number,
    userId?: number,
  ): Promise<Array<MomentComment & { isLiked: boolean }>> {
    const moment = await this.momentsRepository.findOne({
      where: { id: momentId },
    });

    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }

    const comments = await this.momentCommentsRepository.find({
      where: { moment: { id: momentId } },
      relations: ['author', 'replyToUser', 'parentComment'],
      order: { createdAt: 'DESC' },
    });
    if (!userId || comments.length === 0) {
      return comments.map((comment) => ({ ...comment, isLiked: false }));
    }

    const commentIds = comments.map((comment) => comment.id);
    const likedComments = await this.momentCommentLikesRepository
      .createQueryBuilder('commentLike')
      .select('commentLike.commentId', 'commentId')
      .where('commentLike.commentId IN (:...commentIds)', { commentIds })
      .andWhere('commentLike.userId = :userId', { userId })
      .getRawMany<{ commentId: number }>();
    const likeMap = new Map<number, boolean>(
      likedComments.map((item) => [item.commentId, true]),
    );
    return comments.map((comment) => ({
      ...comment,
      isLiked: likeMap.get(comment.id) || false,
    }));
  }

  // 创建评论
  async createComment(
    momentId: number,
    createCommentDto: CreateMomentCommentDto,
    userId: number,
  ): Promise<MomentComment> {
    const moment = await this.momentsRepository.findOne({
      where: { id: momentId },
    });

    if (!moment) {
      throw new NotFoundException('沸点不存在');
    }

    let parentComment: MomentComment | undefined;
    if (createCommentDto.parentId) {
      const foundParentComment = await this.momentCommentsRepository.findOne({
        where: { id: createCommentDto.parentId, moment: { id: momentId } },
        relations: ['author'],
      });
      if (!foundParentComment) {
        throw new NotFoundException('回复的评论不存在');
      }
      parentComment = foundParentComment;
    }

    const comment = this.momentCommentsRepository.create({
      content: createCommentDto.content,
      moment: { id: momentId },
      author: { id: userId },
      parentComment,
      replyToUser: createCommentDto.replyToUserId
        ? { id: createCommentDto.replyToUserId }
        : parentComment
          ? { id: parentComment.author.id }
          : undefined,
    });

    const savedComment = await this.momentCommentsRepository.save(comment);

    // 更新评论数量
    await this.momentsRepository.increment({ id: momentId }, 'commentCount', 1);

    const fullComment = await this.momentCommentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.moment', 'moment')
      .leftJoinAndSelect('moment.author', 'momentAuthor')
      .leftJoinAndSelect('comment.author', 'commentAuthor')
      .leftJoinAndSelect('comment.parentComment', 'parentComment')
      .leftJoinAndSelect('parentComment.author', 'parentAuthor')
      .leftJoinAndSelect('comment.replyToUser', 'replyToUser')
      .where('comment.id = :id', { id: savedComment.id })
      .getOne();
    if (fullComment?.moment?.author) {
      try {
        await this.notificationsService.notifyMomentComment({
          comment: fullComment,
          moment: fullComment.moment,
          actorUserId: userId,
        });
      } catch {
        /* 通知失败不影响评论 */
      }
    }

    return savedComment;
  }

  // 删除评论
  async removeComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.momentCommentsRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'moment'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.momentCommentsRepository.remove(comment);

    // 更新评论数量
    await this.momentsRepository.decrement(
      { id: comment.moment.id },
      'commentCount',
      1,
    );
  }

  async toggleCommentLike(
    commentId: number,
    userId: number,
  ): Promise<{ isLiked: boolean }> {
    const comment = await this.momentCommentsRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const existingLike = await this.momentCommentLikesRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });
    if (existingLike) {
      await this.momentCommentLikesRepository.remove(existingLike);
      await this.momentCommentsRepository.decrement(
        { id: commentId },
        'likeCount',
        1,
      );
      return { isLiked: false };
    }

    const like = this.momentCommentLikesRepository.create({
      comment: { id: commentId },
      user: { id: userId },
    });
    await this.momentCommentLikesRepository.save(like);
    await this.momentCommentsRepository.increment(
      { id: commentId },
      'likeCount',
      1,
    );
    return { isLiked: true };
  }

  // 获取用户收藏的沸点
  async getFavorites(userId: number): Promise<FavoriteMomentItem[]> {
    const favorites = await this.momentFavoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['moment', 'moment.author', 'moment.topic'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map((favorite) => ({
      ...favorite.moment,
      favoriteId: favorite.id,
      favoritedAt: favorite.createdAt,
    }));
  }

  async count(): Promise<number> {
    return await this.momentsRepository.count();
  }
}
