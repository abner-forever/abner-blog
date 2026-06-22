import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VersionService } from '../services/version.service';
import { AdminGuard } from '../../modules/admin/guards/admin.guard';

@Controller()
@ApiTags('Page Versions')
@ApiBearerAuth('SSO')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  @ApiOperation({ summary: '获取页面版本列表' })
  @ApiParam({ name: 'pageId', description: '页面 ID' })
  @ApiResponse({ status: 200, description: '版本列表' })
  @Get('pages/:pageId/versions')
  findByPage(@Param('pageId') pageId: string) {
    return this.versionService.findByPageId(+pageId);
  }

  @ApiOperation({ summary: '获取版本详情' })
  @ApiParam({ name: 'versionId', description: '版本 ID' })
  @ApiResponse({ status: 200, description: '版本详情' })
  @Get('page-versions/:versionId')
  findOne(@Param('versionId') versionId: string) {
    return this.versionService.findOne(+versionId);
  }

  @ApiOperation({ summary: '恢复到指定版本' })
  @ApiParam({ name: 'pageId', description: '页面 ID' })
  @ApiParam({ name: 'versionId', description: '版本 ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @Post('pages/:pageId/versions/:versionId/restore')
  restore(
    @Param('pageId') pageId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.versionService.restore(+pageId, +versionId);
  }
}
