import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Res,
  Logger,
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PageGeneratorService } from './page-generator.service';
import { CreateConfigDto, ConfigResponseDto } from './dto/create-config.dto';
import { GeneratePageDto, RefinePageDto } from './dto/generate-page.dto';

@ApiTags('Page Generator AI')
@ApiBearerAuth()
@Controller('page-generator')
@UseGuards(AuthGuard(['admin-jwt', 'sso-session']))
export class PageGeneratorController {
  private readonly logger = new Logger(PageGeneratorController.name);

  constructor(private readonly pageGeneratorService: PageGeneratorService) {}

  /* ==================== Config ==================== */

  @Get('config')
  @ApiOperation({ summary: '获取当前用户的 LLM 配置' })
  async getConfig(@Req() req: Request): Promise<ConfigResponseDto | null> {
    const userId = (req.user as { userId: number }).userId;
    return this.pageGeneratorService.getConfig(userId);
  }

  @Post('config')
  @ApiOperation({ summary: '保存/更新 LLM 配置' })
  async saveConfig(
    @Req() req: Request,
    @Body() dto: CreateConfigDto,
  ): Promise<ConfigResponseDto> {
    const userId = (req.user as { userId: number }).userId;
    return this.pageGeneratorService.saveConfig(userId, dto);
  }

  @Delete('config')
  @ApiOperation({ summary: '删除 LLM 配置' })
  async deleteConfig(@Req() req: Request): Promise<{ success: boolean }> {
    const userId = (req.user as { userId: number }).userId;
    await this.pageGeneratorService.deleteConfig(userId);
    return { success: true };
  }

  /* ==================== Generation (SSE) ==================== */

  @Post('generate')
  @ApiOperation({ summary: 'AI 页面生成（SSE 流式）' })
  @ApiResponse({ status: 200, description: 'SSE 流式响应' })
  async generate(
    @Req() req: Request,
    @Body() dto: GeneratePageDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = (req.user as { userId: number }).userId;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

    // Define event callback
    const onEvent = (event: string, data: Record<string, unknown>) => {
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        this.logger.error(`SSE write error for event ${event}:`, err);
      }
    };

    try {
      const sessionId = await this.pageGeneratorService.generatePage(
        userId,
        dto,
        onEvent,
      );
      // Send session_id event
      res.write(`event: session_id\ndata: ${JSON.stringify({ sessionId })}\n\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败';
      res.write(`event: error\ndata: ${JSON.stringify({ message, retryable: true })}\n\n`);
    }

    // Handle client disconnect
    req.on('close', () => {
      res.end();
    });
  }

  /* ==================== Refinement (SSE) ==================== */

  @Post('refine')
  @ApiOperation({ summary: '对话式迭代修改（SSE 流式）' })
  async refine(
    @Req() req: Request,
    @Body() dto: RefinePageDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = (req.user as { userId: number }).userId;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

    const onEvent = (event: string, data: Record<string, unknown>) => {
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        this.logger.error(`SSE write error for refine event ${event}:`, err);
      }
    };

    try {
      await this.pageGeneratorService.refinePage(userId, dto, onEvent);
    } catch (err) {
      const message = err instanceof Error ? err.message : '修改失败';
      res.write(`event: error\ndata: ${JSON.stringify({ message, retryable: true })}\n\n`);
    }

    req.on('close', () => {
      res.end();
    });
  }

  /* ==================== Task Management ==================== */

  @Get('tasks/:sessionId')
  @ApiOperation({ summary: '获取生成任务状态' })
  async getTask(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ) {
    const userId = (req.user as { userId: number }).userId;
    const task = await this.pageGeneratorService.getTask(sessionId, userId);
    if (!task) {
      return { status: 'not_found' };
    }
    return {
      status: task.status,
      sessionId: task.sessionId,
      schema: task.schema,
      regions: task.regions,
      error: task.error,
      pageId: task.pageId,
      createdAt: task.createdAt,
    };
  }

  @Get('tasks')
  @ApiOperation({ summary: '获取生成任务历史' })
  async getTaskHistory(@Req() req: Request) {
    const userId = (req.user as { userId: number }).userId;
    return this.pageGeneratorService.getTaskHistory(userId);
  }

  @Post('tasks/:sessionId/cancel')
  @ApiOperation({ summary: '取消生成任务' })
  async cancelTask(
    @Req() req: Request,
    @Param('sessionId') sessionId: string,
  ): Promise<{ success: boolean }> {
    const userId = (req.user as { userId: number }).userId;
    await this.pageGeneratorService.cancelGeneration(sessionId, userId);
    return { success: true };
  }

  /* ==================== Load into Editor ==================== */

  @Post('load')
  @ApiOperation({ summary: '将 AI 生成的页面载入 GrapesJS 编辑器' })
  async loadIntoEditor(
    @Req() req: Request,
    @Body() body: { sessionId: string; title: string },
  ): Promise<{ pageId: number; slug: string }> {
    const userId = (req.user as { userId: number }).userId;
    return this.pageGeneratorService.loadIntoEditor(
      userId,
      body.sessionId,
      body.title || 'AI 生成的页面',
    );
  }
}
