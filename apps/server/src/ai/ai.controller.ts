import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AIService } from './ai.service';
import { ChatRequestDto, SaveAIConfigDto } from './dto/chat.dto';
import { ChatResponseDto } from './dto/extraction-result.dto';
import { AIConfigPublicKeyResponseDto } from './dto/ai-config.response.dto';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import type { Response } from 'express';

interface OptionalAuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

@ApiTags('AI')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI 聊天接口' })
  @ApiResponse({ status: 200, description: 'AI 响应', type: ChatResponseDto })
  async chat(
    @Request() req: OptionalAuthRequest,
    @Body() chatDto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const userId = req.user?.userId;
    return this.aiService.processMessage(
      chatDto.message,
      userId,
      chatDto.currentDate,
      chatDto.sessionId,
      chatDto,
    );
  }

  @Post('chat/stream')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI 聊天流式接口（SSE）' })
  @ApiResponse({ status: 200, description: 'SSE 流式响应' })
  async chatStream(
    @Request() req: OptionalAuthRequest,
    @Body() chatDto: ChatRequestDto,
    @Res() res: Response,
  ) {
    const userId = req.user?.userId;
    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write(':\n\n');

    try {
      for await (const chunk of this.aiService.processMessageStream(
        chatDto.message,
        userId,
        chatDto.currentDate,
        chatDto.sessionId,
        chatDto,
      )) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        (res as Response & { flush?: () => void }).flush?.();
      }
      res.end();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '流式响应处理失败';
      res.write(
        `data: ${JSON.stringify({ event: 'error', payload: { error: message } })}\n\n`,
      );
      res.end();
    }
  }

  @Post('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '保存用户 AI 模型配置' })
  @ApiResponse({ status: 200, description: '已保存' })
  @ApiResponse({ status: 401, description: '未授权' })
  async saveConfig(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SaveAIConfigDto,
  ) {
    return this.aiService.saveUserAIConfig(req.user.userId, dto);
  }

  @Get('config/public-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取 AI 配置传输加密公钥' })
  @ApiResponse({
    status: 200,
    description: 'RSA 公钥（DER Base64）',
    type: AIConfigPublicKeyResponseDto,
  })
  @ApiResponse({ status: 401, description: '未授权' })
  getConfigPublicKey() {
    return this.aiService.getConfigTransportPublicKey();
  }

  @Post('config/get')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取用户 AI 模型配置' })
  @ApiResponse({ status: 200, description: '用户 AI 配置' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getConfig(@Request() req: AuthenticatedRequest) {
    return this.aiService.getUserAIConfig(req.user.userId);
  }
}
