import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { Blog } from '../../../entities/blog.entity';
import { Topic } from '../../../entities/topic.entity';
import { Moment } from '../../../entities/moment.entity';
import { SiteViewLog } from '../../../entities/site-view-log.entity';
import { DailyViewItemDto } from '../dto/dashboard-manage.dto';

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

function getBeijingDateStr(date: Date = new Date()): string {
  const beijingOffset = 8 * 60;
  const localOffset = date.getTimezoneOffset();
  const beijingTime = new Date(
    date.getTime() + (localOffset + beijingOffset) * 60 * 1000,
  );
  return beijingTime.toISOString().split('T')[0];
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Moment)
    private readonly momentRepository: Repository<Moment>,
    @InjectRepository(SiteViewLog)
    private readonly siteViewLogRepository: Repository<SiteViewLog>,
  ) {}

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

  async getDailyViews(
    type: 'pv' | 'uv' | 'all' = 'all',
  ): Promise<DailyViewItemDto[]> {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = getBeijingDateStr(thirtyDaysAgo);

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
}
