import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CommentDto,
  ToggleCommentLikeResponseDto,
} from '../common/dto/responses/comment.response.dto';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentResponse } from './interfaces/comment-response.interface';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('comments')
@Controller('blogs/:blogId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '创建博客评论' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 201, type: CommentDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('blogId') blogId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.create(
      createCommentDto,
      req.user.userId,
      +blogId,
    );
  }

  @ApiOperation({ summary: '获取博客评论列表' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: [CommentDto] })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @Param('blogId') blogId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<CommentResponse[]> {
    return this.commentsService.findAll(+blogId, req.user?.userId);
  }

  @ApiOperation({ summary: '获取评论详情' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiParam({ name: 'id', description: '评论 ID' })
  @ApiResponse({ status: 200, type: CommentDto })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '更新评论' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiParam({ name: 'id', description: '评论 ID' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.update(+id, updateCommentDto, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '删除评论' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiParam({ name: 'id', description: '评论 ID' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.commentsService.remove(+id, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换评论点赞状态' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiParam({ name: 'id', description: '评论 ID' })
  @ApiResponse({ status: 200, type: ToggleCommentLikeResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.commentsService.toggleLike(+id, req.user.userId);
  }
}
