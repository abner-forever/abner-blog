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
import { ApiTags } from '@nestjs/swagger';
import { AdminSystemAnnouncementsService } from '../services/admin-system-announcements.service';
import {
  CreateSystemAnnouncementDto,
  SystemAnnouncementQueryDto,
  UpdateSystemAnnouncementDto,
} from '../dto/system-announcement-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminSystemAnnouncementsController {
  constructor(
    private readonly adminSystemAnnouncementsService: AdminSystemAnnouncementsService,
  ) {}

  @Get('system-announcements')
  async getSystemAnnouncements(@Query() query: SystemAnnouncementQueryDto) {
    return this.adminSystemAnnouncementsService.getSystemAnnouncements(query);
  }

  @Post('system-announcements')
  async createSystemAnnouncement(@Body() dto: CreateSystemAnnouncementDto) {
    return this.adminSystemAnnouncementsService.createSystemAnnouncement(dto);
  }

  @Get('system-announcements/:id')
  async getSystemAnnouncementById(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.getSystemAnnouncementById(id);
  }

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

  @Delete('system-announcements/:id')
  async deleteSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.deleteSystemAnnouncement(id);
  }

  @Post('system-announcements/:id/publish')
  async publishSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.publishSystemAnnouncement(id);
  }

  @Post('system-announcements/:id/recall')
  async recallSystemAnnouncement(@Param('id', ParseIntPipe) id: number) {
    return this.adminSystemAnnouncementsService.recallSystemAnnouncement(id);
  }

  @Post('system-announcements/:id/sync-notifications')
  async syncSystemAnnouncementNotifications(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminSystemAnnouncementsService.syncSystemAnnouncementNotifications(
      id,
    );
  }
}
