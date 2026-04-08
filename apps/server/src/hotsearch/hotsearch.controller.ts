import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HotsearchService, type HotSearchItem } from './hotsearch.service';
import {
  HotSearchItemDto,
  HotSearchResponseDto,
} from './dto/hotsearch-response.dto';

interface HotSearchResponse {
  weibo: HotSearchItem[];
  bilibili: HotSearchItem[];
  github: HotSearchItem[];
  toutiao: HotSearchItem[];
  douyin: HotSearchItem[];
}

@ApiTags('hotsearch')
@Controller('hotsearch')
export class HotsearchController {
  constructor(private readonly hotsearchService: HotsearchService) {}

  @ApiOperation({ summary: '获取全平台热搜' })
  @ApiQuery({
    name: 'forceRefresh',
    required: false,
    type: Boolean,
    description: '是否强制刷新（前端点击刷新时传 true）',
  })
  @ApiResponse({ status: 200, type: HotSearchResponseDto })
  @Get()
  async getHotSearch(
    @Query('forceRefresh') forceRefresh?: string,
  ): Promise<HotSearchResponse> {
    return this.hotsearchService.getAllHotSearch(forceRefresh === 'true');
  }

  @ApiOperation({ summary: '强制刷新热搜缓存（管理员用）' })
  @ApiResponse({ status: 200, type: HotSearchResponseDto })
  @Get('refresh')
  async refreshCache(): Promise<HotSearchResponse> {
    return this.hotsearchService.refreshCache();
  }

  @ApiOperation({ summary: '获取微博热搜' })
  @ApiResponse({ status: 200, type: HotSearchItemDto, isArray: true })
  @Get('weibo')
  async getWeiboHot(): Promise<HotSearchItem[]> {
    return this.hotsearchService.getWeiboHot();
  }

  @ApiOperation({ summary: '获取 B 站热搜' })
  @ApiResponse({ status: 200, type: HotSearchItemDto, isArray: true })
  @Get('bilibili')
  async getBilibiliHot(): Promise<HotSearchItem[]> {
    return this.hotsearchService.getBilibiliHot();
  }

  @ApiOperation({ summary: '获取 GitHub Trending' })
  @ApiResponse({ status: 200, type: HotSearchItemDto, isArray: true })
  @Get('github')
  async getGitHubHot(): Promise<HotSearchItem[]> {
    return this.hotsearchService.getGitHubHot();
  }
}
