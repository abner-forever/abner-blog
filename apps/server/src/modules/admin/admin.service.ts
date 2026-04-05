import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import { Blog } from '../../entities/blog.entity';
import { Comment } from '../../entities/comment.entity';
import { Topic } from '../../entities/topic.entity';
import { ViewLog } from '../../entities/view-log.entity';
import { MomentViewLog } from '../../entities/moment-view-log.entity';
import { SiteViewLog } from '../../entities/site-view-log.entity';
import { MomentComment } from '../../entities/moment-comment.entity';
import { Moment } from '../../entities/moment.entity';
import { AdminLoginDto } from './dto/login.dto';
import {
  UserManageQueryDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/user-manage.dto';
import { BlogManageQueryDto, AdminUpdateBlogDto } from './dto/blog-manage.dto';
import {
  CommentManageQueryDto,
  BatchDeleteCommentsDto,
} from './dto/comment-manage.dto';
import {
  TopicManageQueryDto,
  AdminCreateTopicDto,
  UpdateTopicDto,
} from './dto/topic-manage.dto';
import { DailyViewItemDto } from './dto/dashboard-manage.dto';
import { SearchMomentDto } from '../../moments/dto/search-moment.dto';
import { UpdateMomentDto } from '../../moments/dto/update-moment.dto';
import { SystemAnnouncement } from '../../entities/system-announcement.entity';
import { NotificationsService } from '../../social/notifications.service';
import { sanitizeAnnouncementHtml } from '../../social/utils/sanitize-announcement-html';
import {
  CreateSystemAnnouncementDto,
  SystemAnnouncementQueryDto,
  UpdateSystemAnnouncementDto,
} from './dto/system-announcement-manage.dto';

// Raw query result interfaces
interface BlogViewCountResult {
  total?: string | number;
}

interface DailyViewResult {
  date: string;
  views: string;
}

interface UniqueVisitorResult {
  date: string;
  uniqueVisitors: string;
}

interface CountResultItem {
  blogId: number;
  count: string;
}

// Comment with relations for blog comments
interface BlogCommentWithAuthor {
  id: number;
  content: string;
  createdAt: Date;
  author?: {
    id: number;
    username: string;
  };
  blog?: {
    id: number;
    title: string;
  };
}

// Comment with relations for moment comments
interface MomentCommentWithRelations {
  id: number;
  content: string;
  createdAt: Date;
  author?: {
    id: number;
    username: string;
  };
  moment?: {
    id: number;
    topic?: {
      id: number;
      name: string;
    };
  };
}

// Blog with author relation
interface BlogWithAuthor {
  id: number;
  title: string;
  summary: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: number;
    username: string;
  };
}

// Moment with relations
interface MomentWithRelations {
  id: number;
  content: string;
  images: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  author?: {
    id: number;
    username: string;
  };
  topic?: {
    id: number;
    name: string;
  };
}

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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(ViewLog)
    private viewLogRepository: Repository<ViewLog>,
    @InjectRepository(MomentViewLog)
    private momentViewLogRepository: Repository<MomentViewLog>,
    @InjectRepository(SiteViewLog)
    private siteViewLogRepository: Repository<SiteViewLog>,
    @InjectRepository(MomentComment)
    private momentCommentRepository: Repository<MomentComment>,
    @InjectRepository(Moment)
    private momentRepository: Repository<Moment>,
    @InjectRepository(SystemAnnouncement)
    private systemAnnouncementRepository: Repository<SystemAnnouncement>,
    private jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 初始化管理员（仅开发环境使用）
  async initAdmin() {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    let admin = await this.userRepository.findOne({
      where: { username: adminUsername },
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!admin) {
      admin = this.userRepository.create({
        username: adminUsername,
        password: hashedPassword,
        email: 'admin@blog.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(admin);
      return {
        created: true,
        username: adminUsername,
        password: adminPassword,
      };
    }

    // 强制更新密码和角色
    admin.password = hashedPassword;
    admin.role = UserRole.ADMIN;
    admin.status = UserStatus.ACTIVE;
    await this.userRepository.save(admin);

    return { reset: true, username: adminUsername, password: adminPassword };
  }

  // 认证
  async login(loginDto: AdminLoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        email: user.email,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role,
      email: user.email,
    };
  }

  // 仪表盘统计
  async getDashboardStats() {
    const [userCount, blogCount] = await Promise.all([
      this.userRepository.count(),
      this.blogRepository.count(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const blogViewCountResult = await this.blogRepository
      .createQueryBuilder('blog')
      .select('SUM(blog.viewCount)', 'total')
      .getRawOne();

    const total = (blogViewCountResult as BlogViewCountResult | null)?.total;
    return {
      userCount,
      blogCount,
      blogViewCount: parseInt(String(total || '0'), 10),
    };
  }

  // 闲聊统计
  async getMomentsStats() {
    const [momentCount, topicCount] = await Promise.all([
      this.momentRepository.count(),
      this.topicRepository.count(),
    ]);

    return {
      momentCount,
      topicCount,
    };
  }

  // 每日访问量（基于 SiteViewLog）
  // type: pv = 页面浏览量（每次访问都计数）, uv = 独立访客（按IP/用户ID去重）, all = 同时返回 PV 和 UV
  async getDailyViews(
    type: 'pv' | 'uv' | 'all' = 'all',
  ): Promise<DailyViewItemDto[]> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = getBeijingDateStr(thirtyDaysAgo);

    // PV: 直接在 SQL 中使用 DATE_FORMAT 格式化日期，避免时区转换问题
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const pvViews = (await this.siteViewLogRepository
      .createQueryBuilder('siteViewLog')
      .select('DATE_FORMAT(siteViewLog.viewDate, "%Y-%m-%d")', 'date')
      .addSelect('COUNT(*)', 'views')
      .where('siteViewLog.viewDate >= :startDate', { startDate })
      .groupBy('DATE_FORMAT(siteViewLog.viewDate, "%Y-%m-%d")')
      .orderBy('DATE_FORMAT(siteViewLog.viewDate, "%Y-%m-%d")', 'ASC')
      .getRawMany()) as DailyViewResult[];

    const pvViewsMap = new Map<string, number>(
      pvViews.map((v: DailyViewResult) => [v.date, parseInt(v.views)]),
    );

    // UV: 按日期 + 访客标识（userId 或 IP）去重统计
    // 对于登录用户使用 userId，游客使用 ip（如果 ip 为 NULL 则用 'anonymous' 代替）
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const uvViews = (await this.siteViewLogRepository
      .createQueryBuilder('siteViewLog')
      .select('DATE_FORMAT(siteViewLog.viewDate, "%Y-%m-%d")', 'date')
      .addSelect(
        "COUNT(DISTINCT IF(siteViewLog.userId IS NOT NULL AND siteViewLog.userId != 0, siteViewLog.userId, COALESCE(siteViewLog.ip, 'anonymous')))",
        'uniqueVisitors',
      )
      .where('siteViewLog.viewDate >= :startDate', { startDate })
      .groupBy('DATE_FORMAT(siteViewLog.viewDate, "%Y-%m-%d")')
      .orderBy('DATE_FORMAT(siteViewLog.viewDate, "%Y-%m-%d")', 'ASC')
      .getRawMany()) as UniqueVisitorResult[];

    const uvViewsMap = new Map<string, number>(
      uvViews.map((v: UniqueVisitorResult) => [
        v.date,
        parseInt(v.uniqueVisitors),
      ]),
    );

    // 填充30天的数据
    const result: DailyViewItemDto[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = getBeijingDateStr(date);
      const pv = pvViewsMap.get(dateStr) || 0;
      const uv = uvViewsMap.get(dateStr) || 0;

      if (type === 'pv') {
        result.push({ date: dateStr, views: pv });
      } else if (type === 'uv') {
        result.push({ date: dateStr, views: uv });
      } else {
        result.push({ date: dateStr, pv, uv });
      }
    }

    return result;
  }

  // 话题管理
  async getTopics(query: TopicManageQueryDto) {
    const pageNum = query.page || 1;
    const sizeNum = query.size || 10;
    const { keyword } = query;
    const qb = this.topicRepository.createQueryBuilder('topic');

    if (keyword) {
      qb.where('topic.name LIKE :keyword OR topic.description LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    const [list, total] = await qb
      .orderBy('topic.id', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return { list, total };
  }

  async createTopic(dto: AdminCreateTopicDto) {
    const topic = this.topicRepository.create(dto);
    return this.topicRepository.save(topic);
  }

  async updateTopic(id: number, dto: UpdateTopicDto) {
    const topic = await this.topicRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }
    Object.assign(topic, dto);
    return this.topicRepository.save(topic);
  }

  async deleteTopic(id: number) {
    const topic = await this.topicRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('话题不存在');
    }
    await this.topicRepository.remove(topic);
  }

  // 博客评论
  async getBlogComments(query: CommentManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const blogIdNum = query.blogId ? parseInt(query.blogId, 10) : undefined;
    const { keyword } = query;
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.blog', 'blog')
      .select([
        'comment',
        'author.id',
        'author.username',
        'blog.id',
        'blog.title',
      ]);

    if (blogIdNum) {
      qb.where('comment.blogId = :blogId', { blogId: blogIdNum });
    }
    if (keyword) {
      qb.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('comment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((comment) => {
        const author = comment.author as
          | BlogCommentWithAuthor['author']
          | undefined;
        const blog = comment.blog as BlogCommentWithAuthor['blog'] | undefined;
        return {
          ...comment,
          authorUsername: author?.username,
          authorId: author?.id,
          blogTitle: blog?.title,
          blogId: blog?.id,
        };
      }),
      total,
    };
  }

  // 闲聊评论 - 通过 momentId 查询
  async getTopicComments(query: CommentManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const momentIdNum = query.topicId ? parseInt(query.topicId, 10) : undefined;
    const { keyword } = query;
    const qb = this.momentCommentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.moment', 'moment')
      .leftJoinAndSelect('moment.topic', 'topic')
      .select([
        'comment',
        'author.id',
        'author.username',
        'moment.id',
        'topic.id',
        'topic.name',
      ]);

    if (momentIdNum) {
      qb.where('moment.id = :momentId', { momentId: momentIdNum });
    }
    if (keyword) {
      qb.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('comment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((comment) => {
        const author = comment.author as
          | MomentCommentWithRelations['author']
          | undefined;
        const moment = comment.moment as
          | MomentCommentWithRelations['moment']
          | undefined;
        return {
          id: comment.id,
          content: comment.content,
          authorUsername: author?.username,
          authorId: author?.id,
          topicName: moment?.topic?.name,
          topicId: moment?.topic?.id,
          createdAt: comment.createdAt,
        };
      }),
      total,
    };
  }

  // 用户管理
  async getUsers(query: UserManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const { keyword, status } = query;
    const qb = this.userRepository.createQueryBuilder('user');

    if (keyword) {
      qb.where('user.username LIKE :keyword OR user.email LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }
    if (status) {
      qb.andWhere('user.status = :status', { status });
    }

    const [list, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return { list, total };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async createUser(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.getUserById(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async deleteUser(id: number) {
    const user = await this.getUserById(id);
    await this.userRepository.remove(user);
  }

  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    const user = await this.getUserById(id);
    user.status = dto.status;
    return this.userRepository.save(user);
  }

  // 博客管理
  async getBlogs(query: BlogManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const { keyword, isPublished, sortBy, sortOrder } = query;

    // 获取点赞、评论、收藏数量（先查询所有满足条件的博客ID）
    const baseQb = this.blogRepository
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.author', 'author')
      .select([
        'blog.id',
        'blog.title',
        'blog.summary',
        'blog.isPublished',
        'blog.viewCount',
        'blog.createdAt',
        'blog.updatedAt',
        'author.id',
        'author.username',
      ]);

    if (keyword) {
      baseQb.where('blog.title LIKE :keyword OR blog.summary LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }
    if (isPublished !== undefined) {
      baseQb.andWhere('blog.isPublished = :isPublished', { isPublished });
    }

    // 排序
    const orderField = sortBy ? `blog.${sortBy}` : 'blog.createdAt';
    const orderDirection = sortOrder || 'DESC';
    baseQb.orderBy(orderField, orderDirection);

    const list = await baseQb.getMany();
    const blogIds = list.map((b) => b.id);

    // 如果没有数据，直接返回
    if (blogIds.length === 0) {
      return { list: [], total: 0 };
    }

    // 获取点赞、评论、收藏数量
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [likeCounts, commentCounts, favoriteCounts] = await Promise.all([
      blogIds.length
        ? this.blogRepository.manager.query(`
        SELECT blogId, COUNT(*) as count FROM \`like\` WHERE blogId IN (${blogIds.join(',')}) GROUP BY blogId
      `)
        : [],
      blogIds.length
        ? this.blogRepository.manager.query(`
        SELECT blogId, COUNT(*) as count FROM comment WHERE blogId IN (${blogIds.join(',')}) GROUP BY blogId
      `)
        : [],
      blogIds.length
        ? this.blogRepository.manager.query(`
        SELECT blogId, COUNT(*) as count FROM favorite WHERE blogId IN (${blogIds.join(',')}) GROUP BY blogId
      `)
        : [],
    ]);

    const likeMap = new Map<number, number>(
      (likeCounts as CountResultItem[]).map((l) => [
        l.blogId,
        parseInt(l.count),
      ]),
    );
    const commentMap = new Map<number, number>(
      (commentCounts as CountResultItem[]).map((c) => [
        c.blogId,
        parseInt(c.count),
      ]),
    );
    const favoriteMap = new Map<number, number>(
      (favoriteCounts as CountResultItem[]).map((f) => [
        f.blogId,
        parseInt(f.count),
      ]),
    );

    // 分页
    const start = (pageNum - 1) * sizeNum;
    const paginatedList = list.slice(start, start + sizeNum);

    return {
      list: paginatedList.map((blog) => {
        const author = blog.author as BlogWithAuthor['author'] | undefined;
        return {
          id: blog.id,
          title: blog.title,
          summary: blog.summary,
          isPublished: blog.isPublished,
          viewCount: blog.viewCount,
          likeCount: likeMap.get(blog.id) || 0,
          commentCount: commentMap.get(blog.id) || 0,
          favoriteCount: favoriteMap.get(blog.id) || 0,
          authorUsername: author?.username,
          authorId: author?.id,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        };
      }),
      total: list.length,
    };
  }

  async getBlogById(id: number) {
    const blog = await this.blogRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!blog) {
      throw new NotFoundException('博客不存在');
    }
    return blog;
  }

  async updateBlog(id: number, dto: AdminUpdateBlogDto) {
    const blog = await this.getBlogById(id);
    Object.assign(blog, dto);
    return this.blogRepository.save(blog);
  }

  async deleteBlog(id: number) {
    const blog = await this.getBlogById(id);
    await this.blogRepository.remove(blog);
  }

  async toggleBlogPublish(id: number, isPublished: boolean) {
    const blog = await this.getBlogById(id);
    blog.isPublished = isPublished;
    return this.blogRepository.save(blog);
  }

  // 评论管理
  async getComments(query: CommentManageQueryDto) {
    const pageNum = query.page ? parseInt(query.page, 10) : 1;
    const sizeNum = query.size ? parseInt(query.size, 10) : 10;
    const blogIdNum = query.blogId ? parseInt(query.blogId, 10) : undefined;
    const { keyword } = query;
    const qb = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.blog', 'blog')
      .select([
        'comment',
        'author.id',
        'author.username',
        'blog.id',
        'blog.title',
      ]);

    if (blogIdNum) {
      qb.where('comment.blogId = :blogId', { blogId: blogIdNum });
    }
    if (keyword) {
      qb.andWhere('comment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }

    const [list, total] = await qb
      .orderBy('comment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((comment) => {
        const author = comment.author as
          | BlogCommentWithAuthor['author']
          | undefined;
        const blog = comment.blog as BlogCommentWithAuthor['blog'] | undefined;
        return {
          ...comment,
          authorUsername: author?.username,
          authorId: author?.id,
          blogTitle: blog?.title,
          blogId: blog?.id,
        };
      }),
      total,
    };
  }

  async deleteComment(id: number) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('评论不存在');
    }
    await this.commentRepository.remove(comment);
  }

  async batchDeleteComments(dto: BatchDeleteCommentsDto) {
    await this.commentRepository.delete(dto.ids);
  }

  // 闲聊管理
  async getMoments(query: SearchMomentDto) {
    const pageNum = query.page ? parseInt(String(query.page), 10) : 1;
    const sizeNum = query.pageSize ? parseInt(String(query.pageSize), 10) : 10;
    const { search: keyword, topicId } = query;

    const qb = this.momentRepository
      .createQueryBuilder('moment')
      .leftJoinAndSelect('moment.author', 'author')
      .leftJoinAndSelect('moment.topic', 'topic')
      .select([
        'moment',
        'author.id',
        'author.username',
        'topic.id',
        'topic.name',
      ]);

    if (keyword) {
      qb.where('moment.content LIKE :keyword', { keyword: `%${keyword}%` });
    }
    if (topicId) {
      qb.andWhere('moment.topicId = :topicId', {
        topicId: topicId,
      });
    }

    const [list, total] = await qb
      .orderBy('moment.createdAt', 'DESC')
      .skip((pageNum - 1) * sizeNum)
      .take(sizeNum)
      .getManyAndCount();

    return {
      list: list.map((moment) => {
        const author = moment.author as
          | MomentWithRelations['author']
          | undefined;
        const topic = moment.topic as MomentWithRelations['topic'] | undefined;
        return {
          id: moment.id,
          content: moment.content,
          images: moment.images,
          authorUsername: author?.username,
          authorId: author?.id,
          topicName: topic?.name,
          topicId: topic?.id,
          viewCount: moment.viewCount,
          likeCount: moment.likeCount,
          commentCount: moment.commentCount,
          createdAt: moment.createdAt,
        };
      }),
      total,
    };
  }

  async getMomentById(id: number) {
    const moment = await this.momentRepository.findOne({
      where: { id },
      relations: ['author', 'topic'],
    });
    if (!moment) {
      throw new NotFoundException('闲聊不存在');
    }
    return moment;
  }

  async updateMoment(id: number, dto: UpdateMomentDto) {
    const moment = await this.getMomentById(id);
    if (dto.content !== undefined) {
      moment.content = dto.content;
    }
    if (dto.images !== undefined) {
      moment.images = dto.images;
    }
    if (dto.topicId !== undefined) {
      if (dto.topicId) {
        const topic = await this.topicRepository.findOne({
          where: { id: dto.topicId },
        });
        moment.topic = topic;
      } else {
        moment.topic = null;
      }
    }
    return this.momentRepository.save(moment);
  }

  async deleteMoment(id: number) {
    const moment = await this.getMomentById(id);
    await this.momentRepository.remove(moment);
  }

  async getSystemAnnouncements(query: SystemAnnouncementQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const [list, total] = await this.systemAnnouncementRepository.findAndCount({
      order: { sortOrder: 'DESC', createdAt: 'DESC' },
      skip,
      take: pageSize,
    });
    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    };
  }

  async createSystemAnnouncement(dto: CreateSystemAnnouncementDto) {
    const row = this.systemAnnouncementRepository.create({
      title: dto.title,
      bodyRich: sanitizeAnnouncementHtml(dto.bodyRich),
      imageUrls: dto.imageUrls?.length ? dto.imageUrls : null,
      sortOrder: dto.sortOrder ?? 0,
      published: false,
    });
    return this.systemAnnouncementRepository.save(row);
  }

  async getSystemAnnouncementById(id: number) {
    const row = await this.systemAnnouncementRepository.findOne({
      where: { id },
    });
    if (!row) {
      throw new NotFoundException('系统通知不存在');
    }
    return row;
  }

  async updateSystemAnnouncement(id: number, dto: UpdateSystemAnnouncementDto) {
    const row = await this.getSystemAnnouncementById(id);
    if (dto.title !== undefined) {
      row.title = dto.title;
    }
    if (dto.bodyRich !== undefined) {
      row.bodyRich = sanitizeAnnouncementHtml(dto.bodyRich);
    }
    if (dto.imageUrls !== undefined) {
      row.imageUrls = dto.imageUrls?.length ? dto.imageUrls : null;
    }
    if (dto.sortOrder !== undefined) {
      row.sortOrder = dto.sortOrder;
    }
    return this.systemAnnouncementRepository.save(row);
  }

  async deleteSystemAnnouncement(id: number) {
    await this.getSystemAnnouncementById(id);
    await this.systemAnnouncementRepository.delete({ id });
  }

  async publishSystemAnnouncement(id: number) {
    const row = await this.getSystemAnnouncementById(id);
    if (row.published) {
      return { announcement: row, notificationsCreated: 0 };
    }
    row.published = true;
    row.publishedAt = new Date();
    row.recalledAt = null;
    row.notifyRevision = 1;
    await this.systemAnnouncementRepository.save(row);
    const { created } =
      await this.notificationsService.createForAllUsersFromAnnouncement(row);
    return { announcement: row, notificationsCreated: created };
  }

  /** 撤回：用户端展示「已撤回」，详情页不再展示正文 */
  async recallSystemAnnouncement(id: number) {
    const row = await this.getSystemAnnouncementById(id);
    if (!row.published) {
      throw new BadRequestException('未发布的通知不能撤回');
    }
    if (row.recalledAt) {
      throw new BadRequestException('该通知已撤回');
    }
    row.recalledAt = new Date();
    await this.systemAnnouncementRepository.save(row);
    const { updated } =
      await this.notificationsService.bulkMarkRecalledForAnnouncement(row.id);
    return { announcement: row, notificationsUpdated: updated };
  }

  /**
   * 编辑保存后重新推送：提升 notifyRevision、解除撤回，并同步所有用户通知正文摘要（含新注册用户补发）
   */
  async syncSystemAnnouncementNotifications(id: number) {
    const row = await this.getSystemAnnouncementById(id);
    if (!row.published) {
      throw new BadRequestException('仅已发布的通知可重新推送');
    }
    row.notifyRevision = (row.notifyRevision ?? 0) + 1;
    if (row.notifyRevision < 1) {
      row.notifyRevision = 1;
    }
    row.recalledAt = null;
    await this.systemAnnouncementRepository.save(row);
    const { updated, created } =
      await this.notificationsService.syncAnnouncementFeeds(row);
    return {
      announcement: row,
      notificationsUpdated: updated,
      notificationsCreated: created,
    };
  }
}
