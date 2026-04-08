import { Controller, Get, Post, Body, Ip, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiProperty,
  ApiResponse,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { BlogsService } from './blogs/blogs.service';
import { MomentsService } from './moments/moments.service';
import { ViewLog } from './entities/view-log.entity';
import { SiteViewLog } from './entities/site-view-log.entity';
import { User } from './entities/user.entity';
import { DataSource } from 'typeorm';
import { AuthenticatedRequest } from './common/interfaces/request.interface';

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

export class AppStatsResponse {
  @ApiProperty({ description: '文章数量' })
  articles: number;
  @ApiProperty({ description: '沸点数量' })
  moments: number;
  @ApiProperty({ description: '访问量' })
  views: number;
  @ApiProperty({ description: '用户数量' })
  users: number;
}
@ApiTags('app')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly blogsService: BlogsService,
    private readonly momentsService: MomentsService,
    private readonly dataSource: DataSource,
  ) {}

  @ApiOperation({ summary: '服务健康检查' })
  @ApiResponse({ status: 200, type: String })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOperation({
    summary: '获取站点统计数据',
    operationId: 'getStats',
  })
  @ApiResponse({ status: 200, type: AppStatsResponse })
  @Get('stats')
  async getStats() {
    try {
      const blogCount = await this.blogsService.count();
      const momentCount = await this.momentsService.count();
      const viewCount = await this.dataSource.getRepository(ViewLog).count();
      const userCount = await this.dataSource.getRepository(User).count();

      return {
        articles: blogCount,
        moments: momentCount,
        views: viewCount,
        users: userCount,
      };
    } catch (error) {
      console.error('Stats error:', error);
      return {
        articles: 0,
        moments: 0,
        views: 0,
        users: 0,
      };
    }
  }

  @ApiOperation({ summary: '跟踪页面访问' })
  @Post('track/page-view')
  async trackPageView(
    @Body() body: { path: string },
    @Ip() ip: string,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const userId = req.user?.userId;
      const effectiveIp = ip || 'anonymous';
      const today = getBeijingDateStr();

      // 记录页面访问
      const siteViewLog = this.dataSource.getRepository(SiteViewLog).create({
        path: body.path || '/',
        userId: userId || undefined,
        ip: userId ? undefined : effectiveIp,
        viewDate: today,
      });
      await this.dataSource.getRepository(SiteViewLog).save(siteViewLog);

      return { success: true };
    } catch (error) {
      console.error('Track page view error:', error);
      return { success: false };
    }
  }
}
