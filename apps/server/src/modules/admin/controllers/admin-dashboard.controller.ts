import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import {
  GetDailyViewsQueryDto,
  DailyViewItemDto,
  ViewType,
} from '../dto/dashboard-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminDashboardService.getDashboardStats();
  }

  @Get('dashboard/moments-stats')
  async getMomentsStats() {
    return this.adminDashboardService.getMomentsStats();
  }

  @ApiOperation({ summary: '每日访问量' })
  @Get('dashboard/daily-views')
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ViewType,
    description: '访问类型：pv=页面浏览量, uv=独立访客, all=全部',
    default: ViewType.ALL,
  })
  async getDailyViews(
    @Query() query: GetDailyViewsQueryDto,
  ): Promise<DailyViewItemDto[]> {
    return this.adminDashboardService.getDailyViews(query.type);
  }
}
