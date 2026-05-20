import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { ChatSessionCrudService } from './services/chat-session-crud.service';
import { SaveSessionDto, DeleteSessionDto } from './dto/chat-session.dto';

@ApiTags('AI - Sessions')
@Controller('ai/sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AISessionController {
  constructor(
    private readonly chatSessionCrudService: ChatSessionCrudService,
  ) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取用户的所有会话（含完整消息）' })
  async listSessions(@Request() req: AuthenticatedRequest) {
    const sessions = await this.chatSessionCrudService.listSessions(
      req.user.userId,
    );
    return sessions.map((s) => ({
      sessionId: s.sessionId,
      title: s.title,
      model: s.model,
      timestamp: new Date(s.updatedAt).getTime(),
      messages: s.messages,
    }));
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保存/更新会话' })
  async saveSession(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SaveSessionDto,
  ) {
    await this.chatSessionCrudService.saveSession(req.user.userId, dto.sessionId, {
      title: dto.title,
      messages: dto.messages as Record<string, unknown>[],
      model: dto.model,
    });
    return { success: true };
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除会话' })
  async deleteSession(
    @Request() req: AuthenticatedRequest,
    @Body() dto: DeleteSessionDto,
  ) {
    await this.chatSessionCrudService.deleteSession(
      req.user.userId,
      dto.sessionId,
    );
    return { success: true };
  }
}
