import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import {
  TrackEventDto,
  TrackEventBatchDto,
  QueryTrackEventsDto,
  TrackEventStatsDto,
} from './dto/track-event.dto';
import {
  PerformanceMetricDto,
  QueryPerformanceMetricsDto,
  PerformanceStatsDto,
} from './dto/performance-metric.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { parseUserAgent } from '../common/utils/user-agent';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '上报埋点事件' })
  async track(@Body() dto: TrackEventDto, @Req() req: AuthenticatedRequest) {
    const extra = this.extractCommonFields(req);
    return this.analyticsService.createTrackEvent(dto, extra);
  }

  @Post('track/batch')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量上报埋点事件' })
  async trackBatch(
    @Body() dto: TrackEventBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const extra = this.extractCommonFields(req);
    return this.analyticsService.createTrackEventsBatch(dto.events, extra);
  }

  @Post('performance')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '上报性能数据' })
  async performance(
    @Body() dto: PerformanceMetricDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const extra = this.extractCommonFields(req);
    return this.analyticsService.createPerformanceMetric(dto, extra);
  }

  @Get('events')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询埋点事件列表' })
  async getTrackEvents(@Query() query: QueryTrackEventsDto) {
    return this.analyticsService.findTrackEvents(query);
  }

  @Get('events/stats')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取埋点事件统计' })
  async getTrackEventStats(@Query() query: TrackEventStatsDto) {
    return this.analyticsService.getTrackEventStats(query);
  }

  @Get('performance')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询性能数据列表' })
  async getPerformanceMetrics(@Query() query: QueryPerformanceMetricsDto) {
    return this.analyticsService.findPerformanceMetrics(query);
  }

  @Get('performance/stats')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取性能数据统计' })
  async getPerformanceStats(@Query() query: PerformanceStatsDto) {
    return this.analyticsService.getPerformanceStats(query);
  }

  @Get('performance/top-pages')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取性能最差的页面' })
  async getTopPages(@Query('limit') limit?: number) {
    return this.analyticsService.getTopPages(limit);
  }

  // 全局概览
  @Get('overview')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取埋点概览统计' })
  async getOverview(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.analyticsService.getOverviewStats(startTime, endTime);
  }

  // 事件趋势
  @Get('trend')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取事件趋势' })
  async getEventTrend(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.analyticsService.getEventTrend(startTime, endTime, granularity);
  }

  // 用户列表
  @Get('users')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户列表' })
  async getUserList(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.analyticsService.getUserList({
      startTime,
      endTime,
      page,
      pageSize,
    });
  }

  // 用户行为详情
  @Get('users/:anonymousId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户行为详情' })
  async getUserBehaviorDetail(
    @Param('anonymousId') anonymousId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('eventName') eventName?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.analyticsService.getUserBehaviorDetail(anonymousId, {
      startTime,
      endTime,
      eventName,
      page,
      pageSize,
    });
  }

  // 页面访问统计
  @Get('pageviews')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取页面访问统计' })
  async getPageViewStats(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.analyticsService.getPageViewStats(
      startTime,
      endTime,
      granularity,
    );
  }

  // 点击事件统计
  @Get('clicks')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取点击事件统计' })
  async getClickEventStats(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.analyticsService.getClickEventStats(
      startTime,
      endTime,
      granularity,
    );
  }

  // 热门页面
  @Get('popular-pages')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取热门页面排行' })
  async getPopularPages(@Query('limit') limit?: number) {
    return this.analyticsService.getPopularPages(limit);
  }

  private extractCommonFields(req: AuthenticatedRequest) {
    const getHeaderString = (key: string): string => {
      const value = req.headers[key];
      return Array.isArray(value) ? value[0] : value || '';
    };

    const getIp = (): string => {
      const ip =
        req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
      return (
        getHeaderString('x-forwarded-for') || (typeof ip === 'string' ? ip : '')
      );
    };

    const userAgent = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    return {
      ip: getIp(),
      userAgent,
      deviceType,
      browser,
      os,
      sessionId: getHeaderString('x-session-id') || this.generateSessionId(),
      anonymousId: getHeaderString('x-anonymous-id'),
      userId: req.user?.userId,
    };
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
