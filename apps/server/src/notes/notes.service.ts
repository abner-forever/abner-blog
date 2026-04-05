import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, FindOptionsWhere } from 'typeorm';
import { Note } from '../entities/note.entity';
import { NoteComment } from '../entities/note-comment.entity';
import { NoteLike } from '../entities/note-like.entity';
import { NoteFavorite } from '../entities/note-favorite.entity';
import { NoteCommentLike } from '../entities/note-comment-like.entity';
import { NoteViewLog } from '../entities/note-view-log.entity';
import { Topic } from '../entities/topic.entity';
import { NoteCollectionItem } from '../entities/note-collection.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { SearchNoteDto } from './dto/search-note.dto';
import { CreateNoteCommentDto } from './dto/create-note-comment.dto';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';
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

export interface NoteItem {
  id: number;
  title?: string;
  content: string;
  images: string[];
  videos: string[];
  cover?: string;
  location: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  };
  topic?: {
    id: number;
    name: string;
  };
  isLiked: boolean;
  isFavorited: boolean;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

type NoteDetail = Omit<NoteItem, 'isLiked' | 'isFavorited'> & {
  isLiked: boolean;
  isFavorited: boolean;
};

type FavoriteNoteItem = Omit<NoteItem, 'isLiked' | 'isFavorited'> & {
  favoriteId: number;
  favoritedAt: Date;
};

interface NoteIdResult {
  noteId: number;
}

export interface NestedComment {
  id: number;
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  };
  replyToUser?: {
    id: number;
    nickname: string;
  };
  parentId: number | null;
  replies: NestedComment[];
}

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
    @InjectRepository(NoteComment)
    private noteCommentsRepository: Repository<NoteComment>,
    @InjectRepository(NoteCommentLike)
    private noteCommentLikesRepository: Repository<NoteCommentLike>,
    @InjectRepository(NoteLike)
    private noteLikesRepository: Repository<NoteLike>,
    @InjectRepository(NoteFavorite)
    private noteFavoritesRepository: Repository<NoteFavorite>,
    @InjectRepository(NoteCollectionItem)
    private noteCollectionItemsRepository: Repository<NoteCollectionItem>,
    @InjectRepository(NoteViewLog)
    private noteViewLogsRepository: Repository<NoteViewLog>,
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private serializeAuthor(author: Note['author']): NoteItem['author'] {
    return {
      id: author.id,
      username: author.username,
      nickname: author.nickname,
      avatar: author.avatar,
    };
  }

  private serializeNoteWithSafeAuthor<T extends Note>(
    note: T,
  ): Omit<T, 'author'> & { author: NoteItem['author'] } {
    return {
      ...note,
      author: this.serializeAuthor(note.author),
    };
  }

  async create(createNoteDto: CreateNoteDto, userId: number): Promise<Note> {
    const cover = createNoteDto.cover || createNoteDto.images?.[0];
    const note = this.notesRepository.create({
      ...createNoteDto,
      cover,
      author: { id: userId },
      topic: createNoteDto.topicId ? { id: createNoteDto.topicId } : undefined,
    });

    const savedNote = await this.notesRepository.save(note);

    // 更新话题的笔记数量
    if (createNoteDto.topicId) {
      await this.topicsRepository.increment(
        { id: createNoteDto.topicId },
        'noteCount',
        1,
      );
    }

    return savedNote;
  }

  async findAll(
    searchDto: SearchNoteDto,
    userId?: number,
  ): Promise<PaginatedResponse<NoteItem>> {
    const {
      page = 1,
      pageSize = 10,
      search,
      topicId,
      sortBy = 'time',
    } = searchDto;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.notesRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.author', 'author')
      .leftJoinAndSelect('note.topic', 'topic')
      .select([
        'note.id',
        'note.title',
        'note.content',
        'note.images',
        'note.videos',
        'note.cover',
        'note.location',
        'note.viewCount',
        'note.likeCount',
        'note.commentCount',
        'note.favoriteCount',
        'note.createdAt',
        'note.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'author.avatar',
        'topic.id',
        'topic.name',
      ]);

    if (search) {
      queryBuilder.andWhere('note.content LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (topicId) {
      queryBuilder.andWhere('note.topic.id = :topicId', { topicId });
    }

    // 排序
    if (sortBy === 'hot') {
      queryBuilder.orderBy(
        'note.likeCount * 3 + note.commentCount * 2 + note.favoriteCount * 2 + note.viewCount / 10',
        'DESC',
      );
    } else {
      queryBuilder.orderBy('note.createdAt', 'DESC');
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

    const noteIds = list.map((note) => note.id);

    // 批量检查用户点赞和收藏状态
    let userLikesMap = new Map<number, boolean>();
    let userFavoritesMap = new Map<number, boolean>();
    let userCollectedMap = new Map<number, boolean>();
    if (userId) {
      const userLikes = await this.noteLikesRepository
        .createQueryBuilder('like')
        .innerJoin('like.note', 'note')
        .innerJoin('like.user', 'user')
        .select('note.id', 'noteId')
        .where('note.id IN (:...noteIds)', { noteIds })
        .andWhere('user.id = :userId', { userId })
        .getRawMany();

      const userFavorites = await this.noteFavoritesRepository
        .createQueryBuilder('favorite')
        .innerJoin('favorite.note', 'note')
        .innerJoin('favorite.user', 'user')
        .select('note.id', 'noteId')
        .where('note.id IN (:...noteIds)', { noteIds })
        .andWhere('user.id = :userId', { userId })
        .getRawMany();

      const userInCollections = await this.noteCollectionItemsRepository
        .createQueryBuilder('item')
        .innerJoin('item.note', 'note')
        .innerJoin('item.user', 'user')
        .select('note.id', 'noteId')
        .where('note.id IN (:...noteIds)', { noteIds })
        .andWhere('user.id = :userId', { userId })
        .getRawMany();

      userLikesMap = new Map(
        userLikes.map((item: NoteIdResult) => [item.noteId, true]),
      );
      userFavoritesMap = new Map(
        userFavorites.map((item: NoteIdResult) => [item.noteId, true]),
      );
      userCollectedMap = new Map(
        userInCollections.map((item: NoteIdResult) => [item.noteId, true]),
      );
    }

    const enrichedList = list.map((note) => ({
      ...note,
      title: note.title?.trim() || note.content.slice(0, 30),
      isLiked: userLikesMap.get(note.id) || false,
      isFavorited:
        userFavoritesMap.get(note.id) || userCollectedMap.get(note.id) || false,
    }));

    return {
      list: enrichedList,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number, userId?: number, ip?: string): Promise<NoteDetail> {
    const note = await this.notesRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });

    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    // 防重复浏览
    const today = getBeijingDateStr();
    const effectiveIp = ip || 'anonymous';
    const whereCondition: FindOptionsWhere<NoteViewLog> = {
      noteId: id,
      viewDate: today,
    };

    if (userId) {
      whereCondition.userId = userId;
    } else {
      whereCondition.ip = effectiveIp;
      whereCondition.userId = IsNull();
    }

    const existingLog = await this.noteViewLogsRepository.findOne({
      where: whereCondition,
    });

    if (!existingLog) {
      try {
        const newLog = this.noteViewLogsRepository.create({
          noteId: id,
          userId: userId || undefined,
          ip: userId ? undefined : effectiveIp,
          viewDate: today,
        });
        await this.noteViewLogsRepository.save(newLog);
        await this.notesRepository.increment({ id }, 'viewCount', 1);
        note.viewCount++;
      } catch (e) {
        // 忽略并发冲突
        console.error('记录笔记浏览量失败:', e);
      }
    }

    // 检查用户点赞和收藏状态
    let isLiked = false;
    let isFavorited = false;
    if (userId) {
      const [likeExists, favoriteExists, inCollection] = await Promise.all([
        this.noteLikesRepository.findOne({
          where: { note: { id }, user: { id: userId } },
        }),
        this.noteFavoritesRepository.findOne({
          where: { note: { id }, user: { id: userId } },
        }),
        this.noteCollectionItemsRepository.findOne({
          where: { note: { id }, user: { id: userId } },
        }),
      ]);
      isLiked = !!likeExists;
      isFavorited = !!favoriteExists || !!inCollection;
    }

    return {
      ...this.serializeNoteWithSafeAuthor(note),
      isLiked,
      isFavorited,
    };
  }

  async remove(id: number, userId: number): Promise<void> {
    const note = await this.notesRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });

    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    if (note.author.id !== userId) {
      throw new ForbiddenException('无权删除此笔记');
    }

    // 更新话题的笔记数量
    if (note.topic) {
      await this.topicsRepository.decrement(
        { id: note.topic.id },
        'noteCount',
        1,
      );
    }

    await this.notesRepository.remove(note);
  }

  // 点赞/取消点赞
  async toggleLike(
    noteId: number,
    userId: number,
  ): Promise<{ isLiked: boolean }> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    const existingLike = await this.noteLikesRepository.findOne({
      where: { note: { id: noteId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.noteLikesRepository.remove(existingLike);
      await this.notesRepository.decrement({ id: noteId }, 'likeCount', 1);
      return { isLiked: false };
    } else {
      const like = this.noteLikesRepository.create({
        note: { id: noteId },
        user: { id: userId },
      });
      await this.noteLikesRepository.save(like);
      await this.notesRepository.increment({ id: noteId }, 'likeCount', 1);
      return { isLiked: true };
    }
  }

  // 收藏/取消收藏（旧接口，保持兼容）
  async toggleFavorite(
    noteId: number,
    userId: number,
  ): Promise<{ isFavorited: boolean }> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    const existingFavorite = await this.noteFavoritesRepository.findOne({
      where: { note: { id: noteId }, user: { id: userId } },
    });

    if (existingFavorite) {
      await this.noteFavoritesRepository.remove(existingFavorite);
      await this.notesRepository.decrement({ id: noteId }, 'favoriteCount', 1);
      return { isFavorited: false };
    } else {
      const favorite = this.noteFavoritesRepository.create({
        note: { id: noteId },
        user: { id: userId },
      });
      await this.noteFavoritesRepository.save(favorite);
      await this.notesRepository.increment({ id: noteId }, 'favoriteCount', 1);
      return { isFavorited: true };
    }
  }

  // 获取笔记评论列表（嵌套结构，最多2层）
  async getComments(noteId: number, userId?: number): Promise<NestedComment[]> {
    const comments = await this.noteCommentsRepository.find({
      where: { note: { id: noteId } },
      relations: ['author', 'replyToUser'],
      order: { createdAt: 'ASC' },
    });

    // 获取用户点赞状态
    let userLikesMap = new Map<number, boolean>();
    if (userId) {
      const userCommentLikes = await this.noteCommentsRepository
        .createQueryBuilder('comment')
        .innerJoin('comment.author', 'author')
        .innerJoin('comment.note', 'note')
        .select('comment.id', 'commentId')
        .where('note.id = :noteId', { noteId })
        .andWhere('author.id = :userId', { userId })
        .getRawMany();

      userLikesMap = new Map(
        userCommentLikes.map((item: { commentId: number }) => [
          item.commentId,
          true,
        ]),
      );
    }

    // 构建嵌套结构
    const topLevelComments: NestedComment[] = [];
    const repliesMap = new Map<number, NestedComment[]>();

    // 先分组
    for (const comment of comments) {
      const nested: NestedComment = {
        id: comment.id,
        content: comment.content,
        likeCount: comment.likeCount,
        isLiked: false,
        createdAt: comment.createdAt,
        author: {
          id: comment.author.id,
          username: comment.author.username,
          nickname: comment.author.nickname,
          avatar: comment.author.avatar,
        },
        replyToUser: comment.replyToUser
          ? {
              id: comment.replyToUser.id,
              nickname: comment.replyToUser.nickname,
            }
          : undefined,
        parentId: comment.parentId,
        replies: [],
      };

      if (userId) {
        nested.isLiked = userLikesMap.get(comment.id) || false;
      }

      if (comment.parentId) {
        const replies = repliesMap.get(comment.parentId) || [];
        replies.push(nested);
        repliesMap.set(comment.parentId, replies);
      } else {
        topLevelComments.push(nested);
      }
    }

    // 将 replies 附加到父评论
    for (const comment of topLevelComments) {
      comment.replies = repliesMap.get(comment.id) || [];
    }

    return topLevelComments;
  }

  // 创建评论
  async createComment(
    noteId: number,
    createCommentDto: CreateNoteCommentDto,
    userId: number,
  ): Promise<NoteComment> {
    const note = await this.notesRepository.findOne({
      where: { id: noteId },
    });

    if (!note) {
      throw new NotFoundException('笔记不存在');
    }

    // 如果有 parentId，验证父评论存在
    if (createCommentDto.parentId) {
      const parentComment = await this.noteCommentsRepository.findOne({
        where: { id: createCommentDto.parentId, note: { id: noteId } },
      });
      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }
    }

    const comment = this.noteCommentsRepository.create({
      content: createCommentDto.content,
      note: { id: noteId },
      author: { id: userId },
      parentId: createCommentDto.parentId,
      replyToUser: createCommentDto.replyToUserId
        ? { id: createCommentDto.replyToUserId }
        : undefined,
    });

    const savedComment = await this.noteCommentsRepository.save(comment);
    await this.notesRepository.increment({ id: noteId }, 'commentCount', 1);

    const fullComment = await this.noteCommentsRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.note', 'note')
      .leftJoinAndSelect('note.author', 'noteAuthor')
      .leftJoinAndSelect('c.author', 'commentAuthor')
      .leftJoinAndSelect('c.replyToUser', 'replyToUser')
      .where('c.id = :id', { id: savedComment.id })
      .getOne();
    if (fullComment?.note?.author) {
      try {
        await this.notificationsService.notifyNoteComment({
          comment: fullComment,
          note: fullComment.note,
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
    const comment = await this.noteCommentsRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'note'],
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('无权删除此评论');
    }

    await this.noteCommentsRepository.remove(comment);
    await this.notesRepository.decrement(
      { id: comment.note.id },
      'commentCount',
      1,
    );
  }

  // 点赞评论
  async toggleCommentLike(
    commentId: number,
    userId: number,
  ): Promise<{ isLiked: boolean }> {
    const comment = await this.noteCommentsRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    const existingLike = await this.noteCommentLikesRepository.findOne({
      where: { comment: { id: commentId }, user: { id: userId } },
    });

    if (existingLike) {
      await this.noteCommentLikesRepository.remove(existingLike);
      await this.noteCommentsRepository.decrement(
        { id: commentId },
        'likeCount',
        1,
      );
      return { isLiked: false };
    } else {
      const like = this.noteCommentLikesRepository.create({
        comment: { id: commentId },
        user: { id: userId },
      });
      await this.noteCommentLikesRepository.save(like);
      await this.noteCommentsRepository.increment(
        { id: commentId },
        'likeCount',
        1,
      );
      return { isLiked: true };
    }
  }

  // 获取用户收藏的笔记
  async getFavorites(userId: number): Promise<FavoriteNoteItem[]> {
    const favorites = await this.noteFavoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['note', 'note.author', 'note.topic'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map((favorite) => ({
      ...favorite.note,
      favoriteId: favorite.id,
      favoritedAt: favorite.createdAt,
    }));
  }

  async count(): Promise<number> {
    return await this.notesRepository.count();
  }
}
