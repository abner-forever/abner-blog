import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { PagePV } from '../entities/page-pv.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectRepository(PagePV)
    private readonly pvRepository: Repository<PagePV>,
  ) {}

  /** 记录一次页面访问（PV+1），按天聚合 */
  async recordPV(pageId: number): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      let record = await this.pvRepository.findOne({
        where: { pageId, date: today },
      });

      if (record) {
        record.count += 1;
        await this.pvRepository.save(record);
      } else {
        record = this.pvRepository.create({
          pageId,
          date: today,
          count: 1,
        });
        await this.pvRepository.save(record);
      }
    } catch (err) {
      this.logger.warn(`PV 记录失败 (page #${pageId}): ${err}`);
    }
  }

  /** 获取页面总访问量 */
  async getTotalPV(pageId: number): Promise<number> {
    const result = await this.pvRepository
      .createQueryBuilder('pv')
      .select('SUM(pv.count)', 'total')
      .where('pv.pageId = :pageId', { pageId })
      .getRawOne<{ total: string }>();
    return Number(result?.total || 0);
  }

  /** 获取页面近期 PV（最近 N 天的日访问量） */
  async getDailyPV(
    pageId: number,
    days = 30,
  ): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await this.pvRepository.find({
      where: {
        pageId,
        date: MoreThanOrEqual(startDate.toISOString().slice(0, 10)),
      },
      order: { date: 'ASC' },
    });

    return records.map((r) => ({ date: r.date, count: r.count }));
  }

  /** 批量获取多个页面的总 PV（用于列表展示） */
  async getBatchPV(pageIds: number[]): Promise<Map<number, number>> {
    if (pageIds.length === 0) return new Map();

    const result = await this.pvRepository
      .createQueryBuilder('pv')
      .select('pv.pageId', 'pageId')
      .addSelect('SUM(pv.count)', 'total')
      .where('pv.pageId IN (:...pageIds)', { pageIds })
      .groupBy('pv.pageId')
      .getRawMany<{ pageId: string; total: string }>();

    const map = new Map<number, number>();
    for (const row of result) {
      map.set(Number(row.pageId), Number(row.total));
    }
    return map;
  }
}
