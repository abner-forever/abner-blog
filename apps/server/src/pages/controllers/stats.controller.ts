import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from '../services/stats.service';
import { AdminGuard } from '../../modules/admin/guards/admin.guard';

@Controller()
@ApiTags('Page Stats')
@ApiBearerAuth('SSO')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @ApiOperation({ summary: '获取页面总访问量' })
  @ApiParam({ name: 'pageId', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '总访问量' })
  @Get('pages/:pageId/stats/total')
  async getTotalPV(@Param('pageId') pageId: string) {
    const total = await this.statsService.getTotalPV(+pageId);
    return { pageId: +pageId, total };
  }

  @ApiOperation({ summary: '获取页面日访问量趋势' })
  @ApiParam({ name: 'pageId', description: '页面 ID' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: '最近天数（默认30）',
  })
  @ApiResponse({ status: 200, description: '日访问量数组' })
  @Get('pages/:pageId/stats/daily')
  async getDailyPV(
    @Param('pageId') pageId: string,
    @Query('days') days?: string,
  ) {
    const daily = await this.statsService.getDailyPV(
      +pageId,
      days ? Math.min(parseInt(days, 10), 365) : 30,
    );
    return { pageId: +pageId, daily };
  }

  @ApiOperation({ summary: '批量获取页面 PV（用于列表）' })
  @ApiQuery({ name: 'ids', description: '逗号分隔的页面 ID' })
  @ApiResponse({ status: 200, description: 'PV 映射' })
  @Get('pages/stats/batch')
  async getBatchPV(@Query('ids') ids: string) {
    const pageIds = ids
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n));
    const pvMap = await this.statsService.getBatchPV(pageIds);
    const result: Record<number, number> = {};
    for (const [pageId, total] of pvMap) {
      result[pageId] = total;
    }
    return result;
  }
}
