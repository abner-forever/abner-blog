import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { Blog } from '../entities/blog.entity';
import { Like } from '../entities/like.entity';
import { Favorite } from '../entities/favorite.entity';
import { ViewLog } from '../entities/view-log.entity';
import { Comment } from '../entities/comment.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { SearchBlogDto } from './dto/search-blog.dto';
import { PaginatedResponse } from '../common/interfaces/pagination.interface';

/**
 * 获取北京时间的日期字符串 (YYYY-MM-DD)
 */
function getBeijingDateStr(date: Date = new Date()): string {
  // 使用北京时间 (UTC+8)
  const beijingOffset = 8 * 60; // 北京时间偏移量（分钟）
  const localOffset = date.getTimezoneOffset(); // 本地时区偏移量（分钟）
  const beijingTime = new Date(
    date.getTime() + (localOffset + beijingOffset) * 60 * 1000,
  );
  return beijingTime.toISOString().split('T')[0];
}

interface CountResult {
  blogId: number;
  count: string;
}

interface BlogIdResult {
  blogId: number;
}

interface BlogStats {
  likesCount: number;
  favoritesCount: number;
  commentCount: number;
  isLiked: boolean;
  isFavorited: boolean;
}

export interface SafeBlogAuthor {
  id: number;
  username: string;
  nickname: string | null;
  avatar: string | null;
}

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private blogsRepository: Repository<Blog>,
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(ViewLog)
    private viewLogsRepository: Repository<ViewLog>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
  ) {}

  /**
   * 批量获取博客的点赞数
   */
  private async _getLikesCountMap(
    blogIds: number[],
  ): Promise<Map<number, number>> {
    if (blogIds.length === 0) return new Map();
    const result = await this.likesRepository
      .createQueryBuilder('like')
      .innerJoin('like.blog', 'blog')
      .select('blog.id', 'blogId')
      .addSelect('COUNT(*)', 'count')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .groupBy('blog.id')
      .getRawMany();

    return new Map(
      result.map((item: CountResult) => [item.blogId, parseInt(item.count)]),
    );
  }

  /**
   * 批量获取博客的收藏数
   */
  private async _getFavoritesCountMap(
    blogIds: number[],
  ): Promise<Map<number, number>> {
    if (blogIds.length === 0) return new Map();
    const result = await this.favoritesRepository
      .createQueryBuilder('favorite')
      .innerJoin('favorite.blog', 'blog')
      .select('blog.id', 'blogId')
      .addSelect('COUNT(*)', 'count')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .groupBy('blog.id')
      .getRawMany();

    return new Map(
      result.map((item: CountResult) => [item.blogId, parseInt(item.count)]),
    );
  }

  /**
   * 批量获取博客的评论数
   */
  private async _getCommentsCountMap(
    blogIds: number[],
  ): Promise<Map<number, number>> {
    if (blogIds.length === 0) return new Map();
    const result = await this.commentsRepository
      .createQueryBuilder('comment')
      .innerJoin('comment.blog', 'blog')
      .select('blog.id', 'blogId')
      .addSelect('COUNT(*)', 'count')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .groupBy('blog.id')
      .getRawMany();

    return new Map(
      result.map((item: CountResult) => [item.blogId, parseInt(item.count)]),
    );
  }

  /**
   * 批量获取用户的点赞和收藏状态
   */
  private async _getUserInteractionMaps(
    blogIds: number[],
    userId?: number,
  ): Promise<{
    likesMap: Map<number, boolean>;
    favoritesMap: Map<number, boolean>;
  }> {
    const likesMap = new Map<number, boolean>();
    const favoritesMap = new Map<number, boolean>();

    if (!userId || blogIds.length === 0) {
      return { likesMap, favoritesMap };
    }

    const userLikes = await this.likesRepository
      .createQueryBuilder('like')
      .innerJoin('like.blog', 'blog')
      .innerJoin('like.user', 'user')
      .select('blog.id', 'blogId')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .andWhere('user.id = :userId', { userId })
      .getRawMany();

    const userFavorites = await this.favoritesRepository
      .createQueryBuilder('favorite')
      .innerJoin('favorite.blog', 'blog')
      .innerJoin('favorite.user', 'user')
      .select('blog.id', 'blogId')
      .where('blog.id IN (:...blogIds)', { blogIds })
      .andWhere('user.id = :userId', { userId })
      .getRawMany();

    userLikes.forEach((item: BlogIdResult) => likesMap.set(item.blogId, true));
    userFavorites.forEach((item: BlogIdResult) =>
      favoritesMap.set(item.blogId, true),
    );

    return { likesMap, favoritesMap };
  }

  /**
   * 为博客列表添加统计数据（点赞数、收藏数、评论数、用户交互状态）
   */
  private async enrichBlogsWithStats(
    blogs: Blog[],
    userId?: number,
  ): Promise<(Blog & BlogStats)[]> {
    if (blogs.length === 0) return [];

    const blogIds = blogs.map((blog) => blog.id);
    const [
      likesCountMap,
      favoritesCountMap,
      commentsCountMap,
      { likesMap, favoritesMap },
    ] = await Promise.all([
      this._getLikesCountMap(blogIds),
      this._getFavoritesCountMap(blogIds),
      this._getCommentsCountMap(blogIds),
      this._getUserInteractionMaps(blogIds, userId),
    ]);

    return blogs.map((blog) => ({
      ...blog,
      likesCount: likesCountMap.get(blog.id) || 0,
      favoritesCount: favoritesCountMap.get(blog.id) || 0,
      commentCount: commentsCountMap.get(blog.id) || 0,
      isLiked: likesMap.get(blog.id) || false,
      isFavorited: favoritesMap.get(blog.id) || false,
    }));
  }

  /**
   * 统一作者返回字段，防止敏感信息（如 password）泄露
   */
  private serializeAuthor(author: Blog['author']): SafeBlogAuthor {
    return {
      id: author.id,
      username: author.username,
      nickname: author.nickname ?? null,
      avatar: author.avatar ?? null,
    };
  }

  private serializeBlogWithSafeAuthor<T extends Blog>(
    blog: T,
  ): Omit<T, 'author'> & {
    author: SafeBlogAuthor;
  } {
    return {
      ...blog,
      author: this.serializeAuthor(blog.author),
    };
  }

  async create(createBlogDto: CreateBlogDto, userId: number): Promise<Blog> {
    const blog = this.blogsRepository.create({
      ...createBlogDto,
      author: { id: userId },
    });
    return this.blogsRepository.save(blog);
  }

  async getRecommended(userId?: number) {
    // 获取热门博客：基于浏览量、点赞数、收藏数综合推荐
    // 获取最近30天的博客
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const blogs = await this.blogsRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.author', 'author')
      .where('blog.isPublished = :isPublished', { isPublished: true })
      .andWhere('blog.createdAt >= :date', { date: thirtyDaysAgo })
      .orderBy('blog.viewCount', 'DESC')
      .addOrderBy('blog.createdAt', 'DESC')
      .take(10)
      .select([
        'blog.id',
        'blog.title',
        'blog.summary',
        'blog.cover',
        'blog.tags',
        'blog.viewCount',
        'blog.createdAt',
        'blog.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'author.avatar',
      ])
      .getMany();

    if (blogs.length === 0) {
      return [];
    }

    // 使用通用方法添加统计数据并按热度排序
    const enrichedBlogs = await this.enrichBlogsWithStats(blogs, userId);
    return enrichedBlogs.sort((a, b) => {
      const scoreA = a.likesCount + a.favoritesCount + a.viewCount / 10;
      const scoreB = b.likesCount + b.favoritesCount + b.viewCount / 10;
      return scoreB - scoreA;
    });
  }

  async findAll(
    searchDto: SearchBlogDto,
    userId?: number,
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, pageSize = 10, search, tag } = searchDto;
    const skip = (page - 1) * pageSize;

    // 主查询：获取博客列表
    const queryBuilder = this.blogsRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.author', 'author')
      .select([
        'blog.id',
        'blog.title',
        'blog.summary',
        'blog.cover',
        'blog.tags',
        'blog.viewCount',
        'blog.createdAt',
        'blog.updatedAt',
        'blog.isPublished',
        'author.id',
        'author.username',
        'author.nickname',
        'author.avatar',
      ]);

    // 添加搜索条件
    if (search) {
      queryBuilder.where('blog.title LIKE :search', {
        search: `%${search}%`,
      });
    }
    if (tag) {
      queryBuilder.andWhere('blog.tags LIKE :tag', {
        tag: `%${tag}%`,
      });
    }

    // 按作者 ID 过滤（公开主页使用，只返回已发布的）
    if (searchDto.authorId) {
      queryBuilder.andWhere('author.id = :authorId', {
        authorId: searchDto.authorId,
      });
      queryBuilder.andWhere('blog.isPublished = :isPublished', {
        isPublished: true,
      });
    } else if (!userId || !searchDto.isAuthor) {
      // 游客或非本人：只显示已发布
      queryBuilder.andWhere('blog.isPublished = :isPublished', {
        isPublished: true,
      });
    } else {
      // 作者本人查看自己的博客：显示全部
      queryBuilder.andWhere('blog.author.id = :userId', { userId });
    }

    // 排序和分页
    if (searchDto.sortBy === 'hot') {
      queryBuilder.orderBy('blog.viewCount', 'DESC');
    } else {
      queryBuilder.orderBy('blog.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();

    // 使用通用方法添加统计数据
    const enrichedList = await this.enrichBlogsWithStats(list, userId);

    return {
      list: enrichedList,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByUserId(userId: number) {
    const blogs = await this.blogsRepository.find({
      where: { author: { id: userId } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });

    if (blogs.length === 0) {
      return [];
    }

    // 使用通用方法添加统计数据并清理作者敏感字段
    const enrichedBlogs = await this.enrichBlogsWithStats(blogs, userId);
    return enrichedBlogs.map((blog) => this.serializeBlogWithSafeAuthor(blog));
  }

  async findOne(id: number, userId?: number, ip?: string) {
    const blog = await this.blogsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    if (!blog.isPublished && blog.author.id !== userId) {
      throw new ForbiddenException('无权访问此博客');
    }

    // 增加浏览量（防抖：同一用户/IP 每天只算一次）
    const today = getBeijingDateStr();
    const effectiveIp = ip || 'anonymous'; // 如果没有 IP，使用 anonymous 作为标识
    const whereCondition: FindOptionsWhere<ViewLog> = {
      blogId: id,
      viewDate: today,
    };

    if (userId) {
      whereCondition.userId = userId;
    } else {
      whereCondition.ip = effectiveIp;
      whereCondition.userId = IsNull();
    }

    const existingLog = await this.viewLogsRepository.findOne({
      where: whereCondition,
    });

    if (!existingLog) {
      try {
        const newLog = this.viewLogsRepository.create({
          blogId: id,
          userId: userId || undefined,
          ip: userId ? undefined : effectiveIp,
          viewDate: today,
        });
        await this.viewLogsRepository.save(newLog);
        await this.blogsRepository.increment({ id }, 'viewCount', 1);
        blog.viewCount++;
      } catch (e) {
        // 忽略并发冲突（唯一索引会报错）
        console.error('记录博客浏览量失败:', e);
      }
    }

    // 获取点赞数
    const likesCount = await this.likesRepository.count({
      where: { blog: { id } },
    });

    // 获取收藏数
    const favoritesCount = await this.favoritesRepository.count({
      where: { blog: { id } },
    });

    // 获取评论数
    const commentCount = await this.commentsRepository.count({
      where: { blog: { id } },
    });

    // 检查当前用户点赞状态
    let isLiked = false;
    let isFavorited = false;
    if (userId) {
      const [likeExists, favoriteExists] = await Promise.all([
        this.likesRepository.findOne({
          where: {
            blog: { id },
            user: { id: userId },
          },
        }),
        this.favoritesRepository.findOne({
          where: {
            blog: { id },
            user: { id: userId },
          },
        }),
      ]);
      isLiked = !!likeExists;
      isFavorited = !!favoriteExists;
    }

    return {
      ...this.serializeBlogWithSafeAuthor(blog),
      likesCount,
      favoritesCount,
      commentCount,
      isLiked,
      isFavorited,
    };
  }

  async update(id: number, updateBlogDto: UpdateBlogDto, userId: number) {
    const blog = await this.blogsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    if (blog.author.id !== userId) {
      throw new ForbiddenException('无权修改此博客');
    }

    Object.assign(blog, updateBlogDto);
    const updatedBlog = await this.blogsRepository.save(blog);
    return this.serializeBlogWithSafeAuthor(updatedBlog);
  }

  async togglePublish(id: number, userId: number) {
    const blog = await this.blogsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    if (blog.author.id !== userId) {
      throw new ForbiddenException('无权修改此博客');
    }

    blog.isPublished = !blog.isPublished;
    const updatedBlog = await this.blogsRepository.save(blog);
    return this.serializeBlogWithSafeAuthor(updatedBlog);
  }

  async remove(id: number, userId: number) {
    const blog = await this.blogsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blog) {
      throw new NotFoundException('博客不存在');
    }

    if (blog.author.id !== userId) {
      throw new ForbiddenException('无权删除此博客');
    }

    // 先删除相关的点赞记录
    await this.likesRepository.delete({ blog: { id } });

    // 删除相关的收藏记录
    await this.favoritesRepository.delete({ blog: { id } });

    // 最后删除博客
    await this.blogsRepository.remove(blog);
  }

  async count(): Promise<number> {
    return await this.blogsRepository.count({ where: { isPublished: true } });
  }
}
