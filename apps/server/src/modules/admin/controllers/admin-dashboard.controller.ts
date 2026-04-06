import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import {
  GetDailyViewsQueryDto,
  DailyViewItemDto,
  ViewType,
} from '../dto/dashboard-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiExtraModels(DailyViewItemDto)
@ApiTags('管理后台 - 仪表盘')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ApiOperation({
    summary: '获取仪表盘统计数据',
    operationId: 'getAdminDashboardStats',
  })
  @ApiOkResponse({ description: '仪表盘统计数据' })
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminDashboardService.getDashboardStats();
  }

  @ApiOperation({
    summary: '获取动态统计数据',
    operationId: 'getAdminMomentsStats',
  })
  @ApiOkResponse({ description: '动态统计数据' })
  @Get('dashboard/moments-stats')
  async getMomentsStats() {
    return this.adminDashboardService.getMomentsStats();
  }

  @ApiOperation({ summary: '每日访问量', operationId: 'getAdminDailyViews' })
  @ApiOkResponse({ type: [DailyViewItemDto], description: '每日访问量列表' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ViewType,
    description: '访问类型：pv=页面浏览量, uv=独立访客, all=全部',
    default: ViewType.ALL,
  })
  @Get('dashboard/daily-views')
  async getDailyViews(
    @Query() query: GetDailyViewsQueryDto,
  ): Promise<DailyViewItemDto[]> {
    return this.adminDashboardService.getDailyViews(query.type);
  }
}
