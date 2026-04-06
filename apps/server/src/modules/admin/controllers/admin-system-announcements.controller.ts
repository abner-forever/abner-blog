import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminSystemAnnouncementsService } from '../services/admin-system-announcements.service';
import {
  CreateSystemAnnouncementDto,
  SystemAnnouncementQueryDto,
  UpdateSystemAnnouncementDto,
} from '../dto/system-announcement-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台 - 系统公告管理')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminSystemAnnouncementsController {
  constructor(
    private readonly adminSystemAnnouncementsService: AdminSystemAnnouncementsService,
  ) {}

  @ApiOperation({
    summary: '获取系统公告列表',
    operationId: 'getAdminSystemAnnouncements',
  })
  @ApiOkResponse({ description: '系统公告列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @Get('system-announcements')
  async getSystemAnnouncements(@Query() query: SystemAnnouncementQueryDto) {
    return this.adminSystemAnnouncementsService.getSystemAnnouncements(query);
  }

  @ApiOperation({
    summary: '创建系统公告',
    operationId: 'createAdminSystemAnnouncement',
  })
  @ApiCreatedResponse({ description: '创建的系统公告' })
  @Post('system-announcements')
  async createSystemAnnouncement(@Body() dto: CreateSystemAnnouncementDto) {
    return this.adminSystemAnnouncementsService.createSystemAnnouncement(dto);
  }

  @ApiOperation({
    summary: '获取系统公告详情',
    operationId: 'getAdminSystemAnnouncementById',
  })
  @ApiOkResponse({ description: '系统公告详情' })
  @ApiParam({ name: 'id', type: Number, description: '公告 ID' })
  @Get('system-announcements/:id')
  async getSystemAnnouncementById(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.getSystemAnnouncementById(id);
  }

  @ApiOperation({
    summary: '更新系统公告',
    operationId: 'updateAdminSystemAnnouncement',
  })
  @ApiOkResponse({ description: '更新后的系统公告' })
  @ApiParam({ name: 'id', type: Number, description: '公告 ID' })
  @Patch('system-announcements/:id')
  async updateSystemAnnouncement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemAnnouncementDto,
  ) {
    return this.adminSystemAnnouncementsService.updateSystemAnnouncement(
      id,
      dto,
    );
  }

  @ApiOperation({
    summary: '删除系统公告',
    operationId: 'deleteAdminSystemAnnouncement',
  })
  @ApiOkResponse({ description: '删除成功' })
  @ApiParam({ name: 'id', type: Number, description: '公告 ID' })
  @Delete('system-announcements/:id')
  async deleteSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.deleteSystemAnnouncement(id);
  }

  @ApiOperation({
    summary: '发布系统公告',
    operationId: 'publishAdminSystemAnnouncement',
  })
  @ApiOkResponse({ description: '发布成功' })
  @ApiParam({ name: 'id', type: Number, description: '公告 ID' })
  @Post('system-announcements/:id/publish')
  async publishSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.publishSystemAnnouncement(id);
  }

  @ApiOperation({
    summary: '撤回系统公告',
    operationId: 'recallAdminSystemAnnouncement',
  })
  @ApiOkResponse({ description: '撤回成功' })
  @ApiParam({ name: 'id', type: Number, description: '公告 ID' })
  @Post('system-announcements/:id/recall')
  async recallSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.recallSystemAnnouncement(id);
  }

  @ApiOperation({
    summary: '同步系统公告通知',
    operationId: 'syncAdminSystemAnnouncementNotifications',
  })
  @ApiOkResponse({ description: '同步成功' })
  @ApiParam({ name: 'id', type: Number, description: '公告 ID' })
  @Post('system-announcements/:id/sync-notifications')
  async syncSystemAnnouncementNotifications(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminSystemAnnouncementsService.syncSystemAnnouncementNotifications(
      id,
    );
  }
}
