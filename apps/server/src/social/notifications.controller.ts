import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { SystemAnnouncementPublicDto } from './dto/system-announcement-public.dto';
import {
  DeletedCountResponseDto,
  NotificationListResponseDto,
  NotificationUnreadCountResponseDto,
  UpdatedCountResponseDto,
} from './dto/social-response.dto';

@ApiTags('social')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-count')
  @ApiOperation({ summary: '通知中心未读数（不含私信）' })
  @ApiOkResponse({ type: NotificationUnreadCountResponseDto })
  async unreadCount(@Request() req: AuthenticatedRequest) {
    const feedUnread = await this.notificationsService.countFeedUnread(
      req.user.userId,
    );
    return { feedUnread };
  }

  @Get('announcements/:id')
  @ApiOperation({ summary: '已发布系统公告详情（登录用户）' })
  @ApiOkResponse({ type: SystemAnnouncementPublicDto })
  async announcementDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SystemAnnouncementPublicDto> {
    return this.notificationsService.getPublishedAnnouncement(id);
  }

  @Get()
  @ApiOperation({ summary: '通知列表' })
  @ApiOkResponse({ type: NotificationListResponseDto })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query() q: PaginationQueryDto,
  ) {
    return this.notificationsService.listForUser(
      req.user.userId,
      q.page ?? 1,
      q.pageSize ?? 20,
    );
  }

  @Post('read')
  @ApiOperation({ summary: '标记通知已读' })
  @ApiOkResponse({ type: UpdatedCountResponseDto })
  async markRead(
    @Request() req: AuthenticatedRequest,
    @Body() dto: MarkNotificationsReadDto,
  ) {
    if (dto.markAll) {
      return this.notificationsService.markRead(
        req.user.userId,
        undefined,
        true,
      );
    }
    if (dto.ids?.length) {
      return this.notificationsService.markRead(
        req.user.userId,
        dto.ids,
        false,
      );
    }
    throw new BadRequestException('请提供 ids 或 markAll: true');
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除单条通知' })
  @ApiOkResponse({ type: DeletedCountResponseDto })
  async delete(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.deleteNotification(req.user.userId, id);
  }
}
