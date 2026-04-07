import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { TrackEvent } from '../entities/track-event.entity';
import { PerformanceMetric } from '../entities/performance-metric.entity';
import {
  TrackEventDto,
  QueryTrackEventsDto,
  TrackEventStatsDto,
} from './dto/track-event.dto';
import {
  PerformanceMetricDto,
  QueryPerformanceMetricsDto,
  PerformanceStatsDto,
} from './dto/performance-metric.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(TrackEvent)
    private readonly trackEventRepo: Repository<TrackEvent>,
    @InjectRepository(PerformanceMetric)
    private readonly performanceMetricRepo: Repository<PerformanceMetric>,
  ) {}

  async createTrackEvent(data: TrackEventDto, extra: Partial<TrackEvent>) {
    const event = this.trackEventRepo.create({
      ...data,
      ...Object.fromEntries(
        Object.entries(extra).filter(([, v]) => v !== undefined),
      ),
    } as TrackEvent);
    return this.trackEventRepo.save(event);
  }

  async createTrackEventsBatch(
    events: TrackEventDto[],
    extra: Partial<TrackEvent>,
  ) {
    const filteredExtra = Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v !== undefined),
    );
    const entities = events.map((e) =>
      this.trackEventRepo.create({
        ...e,
        ...filteredExtra,
      } as TrackEvent),
    );
    return this.trackEventRepo.save(entities);
  }

  async createPerformanceMetric(data: PerformanceMetricDto, extra: Partial<PerformanceMetric>) {
    const metric = this.performanceMetricRepo.create({
      ...data,
      ...Object.fromEntries(
        Object.entries(extra).filter(([, v]) => v !== undefined),
      ),
    } as PerformanceMetric);
    return this.performanceMetricRepo.save(metric);
  }

  async findTrackEvents(query: QueryTrackEventsDto) {
    const { eventName, userId, pageUrl, startTime, endTime, page = 1, pageSize = 20 } = query;

    const where: Record<string, unknown> = {};
    if (eventName) where.eventName = eventName;
    if (userId) where.userId = userId;
    if (pageUrl) where.pageUrl = pageUrl;

    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    } else if (startTime) {
      where.createdAt = MoreThanOrEqual(new Date(startTime));
    } else if (endTime) {
      where.createdAt = LessThanOrEqual(new Date(endTime));
    }

    const [list, total] = await this.trackEventRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getTrackEventStats(query: TrackEventStatsDto) {
    const { eventName, startTime, endTime, granularity = 'day' } = query;

    const dateFormat = this.getDateFormat(granularity);

    const result = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('DATE_FORMAT(event.createdAt, :dateFormat)', 'time')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventName = :eventName', { eventName })
      .andWhere('event.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      })
      .setParameter('dateFormat', dateFormat)
      .groupBy('time')
      .orderBy('time', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      time: r.time,
      count: parseInt(r.count, 10),
    }));
  }

  async findPerformanceMetrics(query: QueryPerformanceMetricsDto) {
    const { userId, pageUrl, startTime, endTime, page = 1, pageSize = 20 } = query;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (pageUrl) where.pageUrl = pageUrl;

    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    } else if (startTime) {
      where.createdAt = MoreThanOrEqual(new Date(startTime));
    } else if (endTime) {
      where.createdAt = LessThanOrEqual(new Date(endTime));
    }

    const [list, total] = await this.performanceMetricRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPerformanceStats(query: PerformanceStatsDto) {
    const { startTime, endTime, granularity = 'day', pageUrl } = query;

    const dateFormat = this.getDateFormat(granularity);

    const qb = this.performanceMetricRepo
      .createQueryBuilder('metric')
      .select('DATE_FORMAT(metric.createdAt, :dateFormat)', 'time')
      .addSelect('AVG(metric.lcp)', 'avgLcp')
      .addSelect('AVG(metric.fid)', 'avgFid')
      .addSelect('AVG(metric.cls)', 'avgCls')
      .addSelect('AVG(metric.fcp)', 'avgFcp')
      .addSelect('AVG(metric.ttfb)', 'avgTtfb')
      .where('metric.createdAt BETWEEN :startTime AND :endTime', {
        startTime,
        endTime,
      });

    if (pageUrl) {
      qb.andWhere('metric.pageUrl = :pageUrl', { pageUrl });
    }

    const result = await qb
      .setParameter('dateFormat', dateFormat)
      .groupBy('time')
      .orderBy('time', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      time: r.time,
      lcp: parseFloat(r.avgLcp) || 0,
      fid: parseFloat(r.avgFid) || 0,
      cls: parseFloat(r.avgCls) || 0,
      fcp: parseFloat(r.avgFcp) || 0,
      ttfb: parseFloat(r.avgTtfb) || 0,
    }));
  }

  async getTopPages(limit: number = 10) {
    const result = await this.performanceMetricRepo
      .createQueryBuilder('metric')
      .select('metric.pageUrl', 'pageUrl')
      .addSelect('AVG(metric.lcp)', 'avgLcp')
      .addSelect('AVG(metric.cls)', 'avgCls')
      .addSelect('COUNT(*)', 'count')
      .groupBy('metric.pageUrl')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      pageUrl: r.pageUrl,
      avgLcp: parseFloat(r.avgLcp) || 0,
      avgCls: parseFloat(r.avgCls) || 0,
      count: parseInt(r.count, 10),
    }));
  }

  async deleteOldData(retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const trackResult = await this.trackEventRepo.delete({
      createdAt: LessThanOrEqual(cutoffDate),
    });

    const perfResult = await this.performanceMetricRepo.delete({
      createdAt: LessThanOrEqual(cutoffDate),
    });

    this.logger.log(
      `Deleted ${trackResult.affected} track events and ${perfResult.affected} performance metrics older than ${retentionDays} days`,
    );

    return { trackEvents: trackResult.affected, performanceMetrics: perfResult.affected };
  }

  // 全局概览统计
  async getOverviewStats(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // 总事件数
    const totalEvents = await this.trackEventRepo.count({
      where: { createdAt: Between(start, end) },
    });

    // 总PV (page_view事件数)
    const totalPv = await this.trackEventRepo.count({
      where: { eventName: 'page_view', createdAt: Between(start, end) },
    });

    // 独立访客数 (按anonymousId去重)
    const uvResult = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.anonymousId)', 'uv')
      .where('event.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();
    const uv = parseInt(uvResult?.uv || '0', 10);

    // 点击事件数
    const clickEvents = await this.trackEventRepo.count({
      where: { eventName: 'click', createdAt: Between(start, end) },
    });

    // JS错误数
    const errorEvents = await this.trackEventRepo
      .createQueryBuilder('event')
      .where('event.eventName IN (:...names)', { names: ['js_error', 'unhandled_promise_error'] })
      .andWhere('event.createdAt BETWEEN :start AND :end', { start, end })
      .getCount();

    return {
      totalEvents,
      totalPv,
      uv,
      clickEvents,
      errorEvents,
    };
  }

  // 全局事件趋势
  async getEventTrend(startTime: string, endTime: string, granularity: string = 'day') {
    const dateFormat = this.getDateFormat(granularity);

    const result = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('DATE_FORMAT(event.createdAt, :dateFormat)', 'time')
      .addSelect('event.eventName', 'eventName')
      .addSelect('COUNT(*)', 'count')
      .where('event.createdAt BETWEEN :start AND :end', { start: startTime, end: endTime })
      .setParameter('dateFormat', dateFormat)
      .groupBy('time, event.eventName')
      .orderBy('time', 'ASC')
      .getRawMany();

    // 转换为趋势数据格式
    const timeMap = new Map<string, Record<string, number>>();
    for (const row of result) {
      const time = row.time;
      const eventName = row.eventName;
      const count = parseInt(row.count, 10);

      if (!timeMap.has(time)) {
        timeMap.set(time, { time });
      }
      timeMap.get(time)![eventName] = count;
    }

    return Array.from(timeMap.values()).sort((a, b) => String(a.time).localeCompare(String(b.time)));
  }

  // 用户列表（按设备分组）
  async getUserList(query: {
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { startTime, endTime, page = 1, pageSize = 20 } = query;

    const whereCondition = startTime && endTime
      ? 'event.createdAt BETWEEN :start AND :end'
      : '1=1';
    const params: Record<string, unknown> = {};
    if (startTime && endTime) {
      params.start = new Date(startTime);
      params.end = new Date(endTime);
    }

    const result = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('event.anonymousId', 'anonymousId')
      .addSelect('MAX(event.userId)', 'userId')
      .addSelect('COUNT(*)', 'eventCount')
      .addSelect('COUNT(DISTINCT event.pageUrl)', 'pageCount')
      .addSelect('MIN(event.createdAt)', 'firstVisit')
      .addSelect('MAX(event.createdAt)', 'lastVisit')
      .where(whereCondition, params)
      .groupBy('event.anonymousId')
      .orderBy('MAX(event.createdAt)', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalResult = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('COUNT(DISTINCT event.anonymousId)', 'total')
      .where(whereCondition, params)
      .getRawOne();

    return {
      list: result.map((r) => ({
        anonymousId: r.anonymousId,
        userId: r.userId || null,
        eventCount: parseInt(r.eventCount, 10),
        pageCount: parseInt(r.pageCount, 10),
        firstVisit: r.firstVisit,
        lastVisit: r.lastVisit,
      })),
      total: parseInt(totalResult?.total || '0', 10),
      page,
      pageSize,
    };
  }

  // 用户行为详情
  async getUserBehaviorDetail(anonymousId: string, query: {
    startTime?: string;
    endTime?: string;
    eventName?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { startTime, endTime, eventName, page = 1, pageSize = 50 } = query;

    const where: Record<string, unknown> = { anonymousId };
    if (eventName) where.eventName = eventName;
    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    }

    const [list, total] = await this.trackEventRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 页面访问统计
  async getPageViewStats(startTime: string, endTime: string, granularity: string = 'day') {
    const dateFormat = this.getDateFormat(granularity);

    const result = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('DATE_FORMAT(event.createdAt, :dateFormat)', 'time')
      .addSelect('event.pageUrl', 'pageUrl')
      .addSelect('COUNT(*)', 'pv')
      .addSelect('COUNT(DISTINCT event.anonymousId)', 'uv')
      .where('event.eventName = :eventName', { eventName: 'page_view' })
      .andWhere('event.createdAt BETWEEN :start AND :end', { start: startTime, end: endTime })
      .setParameter('dateFormat', dateFormat)
      .groupBy('time, event.pageUrl')
      .orderBy('pv', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      time: r.time,
      pageUrl: r.pageUrl,
      pv: parseInt(r.pv, 10),
      uv: parseInt(r.uv, 10),
    }));
  }

  // 点击事件统计
  async getClickEventStats(startTime: string, endTime: string, granularity: string = 'day') {
    const dateFormat = this.getDateFormat(granularity);

    const result = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('DATE_FORMAT(event.createdAt, :dateFormat)', 'time')
      .addSelect('event.eventData', 'eventData')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventName = :eventName', { eventName: 'click' })
      .andWhere('event.createdAt BETWEEN :start AND :end', { start: startTime, end: endTime })
      .setParameter('dateFormat', dateFormat)
      .groupBy('time, event.eventData')
      .orderBy('count', 'DESC')
      .limit(50)
      .getRawMany();

    return result.map((r) => {
      let eventData = {};
      try {
        eventData = typeof r.eventData === 'string' ? JSON.parse(r.eventData) : r.eventData || {};
      } catch {}

      return {
        time: r.time,
        count: parseInt(r.count, 10),
        elementTag: eventData['elementTag'] || '',
        elementText: eventData['elementText'] || '',
        pageUrl: eventData['pageUrl'] || '',
      };
    });
  }

  // 热门页面排行
  async getPopularPages(limit: number = 20) {
    const result = await this.trackEventRepo
      .createQueryBuilder('event')
      .select('event.pageUrl', 'pageUrl')
      .addSelect('COUNT(*)', 'pv')
      .addSelect('COUNT(DISTINCT event.anonymousId)', 'uv')
      .where('event.eventName = :eventName', { eventName: 'page_view' })
      .groupBy('event.pageUrl')
      .orderBy('pv', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      pageUrl: r.pageUrl,
      pv: parseInt(r.pv, 10),
      uv: parseInt(r.uv, 10),
    }));
  }

  private getDateFormat(granularity: string): string {
    switch (granularity) {
      case 'hour':
        return '%Y-%m-%d %H:00';
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-%u';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }
}
