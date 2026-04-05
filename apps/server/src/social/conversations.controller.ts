import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { OpenConversationDto } from './dto/open-conversation.dto';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { MarkDmReadThroughDto } from './dto/mark-dm-read-through.dto';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('social')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('unread-count')
  @ApiOperation({ summary: '私信未读消息条数' })
  async unreadCount(@Request() req: AuthenticatedRequest) {
    const dmUnread = await this.conversationsService.countUnreadDmMessages(
      req.user.userId,
    );
    return { dmUnread };
  }

  @Get()
  @ApiOperation({ summary: '我的私信会话列表' })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query() q: PaginationQueryDto,
  ) {
    return this.conversationsService.listConversations(
      req.user.userId,
      q.page ?? 1,
      q.pageSize ?? 20,
    );
  }

  @Post('open')
  @ApiOperation({ summary: '打开或创建与某用户的会话' })
  async open(
    @Request() req: AuthenticatedRequest,
    @Body() dto: OpenConversationDto,
  ) {
    return this.conversationsService.openOrGetConversation(
      req.user.userId,
      dto.peerUserId,
    );
  }

  @Post(':id/read-through')
  @ApiOperation({
    summary: '私信已读游标：推进到指定消息（通常由消息进入聊天可视区触发）',
  })
  @ApiParam({ name: 'id', description: '会话 ID' })
  async markReadThrough(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: MarkDmReadThroughDto,
  ) {
    return this.conversationsService.markReadThroughMessage(
      conversationId,
      req.user.userId,
      dto.messageId,
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '会话消息分页' })
  @ApiParam({ name: 'id', description: '会话 ID' })
  async messages(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
    @Query() q: PaginationQueryDto,
  ) {
    return this.conversationsService.listMessages(
      conversationId,
      req.user.userId,
      q.page ?? 1,
      q.pageSize ?? 30,
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '发送私信' })
  @ApiParam({ name: 'id', description: '会话 ID' })
  async send(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) conversationId: number,
    @Body() dto: SendDirectMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      conversationId,
      req.user.userId,
      dto.content,
      dto.attachments,
    );
  }
}
