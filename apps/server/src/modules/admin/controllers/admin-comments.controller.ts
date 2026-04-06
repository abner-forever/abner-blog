import {
  Controller,
  Get,
  Post,
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
  ApiExtraModels,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminCommentsService } from '../services/admin-comments.service';
import {
  CommentManageQueryDto,
  BatchDeleteCommentsDto,
} from '../dto/comment-manage.dto';
import { AdminGuard } from '../guards/admin.guard';
import {
  CommentDto,
  BlogCommentListResponse,
  TopicCommentListResponse,
  AllCommentListResponse,
} from '../../../common/dto/responses/comment.response.dto';

@ApiExtraModels(
  CommentDto,
  BlogCommentListResponse,
  TopicCommentListResponse,
  AllCommentListResponse,
)
@ApiTags('管理后台 - 评论管理')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminCommentsController {
  constructor(private readonly adminCommentsService: AdminCommentsService) {}

  @ApiOperation({
    summary: '获取博客评论列表（管理端）',
    operationId: 'getAdminBlogComments',
  })
  @ApiOkResponse({ type: BlogCommentListResponse, description: '评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'blogId', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @Get('comments/blog')
  async getBlogComments(@Query() query: CommentManageQueryDto) {
    return this.adminCommentsService.getBlogComments(query);
  }

  @ApiOperation({
    summary: '获取话题评论列表（管理端）',
    operationId: 'getAdminTopicComments',
  })
  @ApiOkResponse({ type: TopicCommentListResponse, description: '评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'topicId', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @Get('comments/topic')
  async getTopicComments(@Query() query: CommentManageQueryDto) {
    return this.adminCommentsService.getTopicComments(query);
  }

  @ApiOperation({
    summary: '获取全部评论列表（管理端）',
    operationId: 'getAdminComments',
  })
  @ApiOkResponse({ type: AllCommentListResponse, description: '评论列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @Get('comments')
  async getComments(@Query() query: CommentManageQueryDto) {
    return this.adminCommentsService.getComments(query);
  }

  @ApiOperation({ summary: '删除评论', operationId: 'deleteAdminComment' })
  @ApiOkResponse({ description: '删除成功' })
  @ApiParam({ name: 'id', type: Number, description: '评论 ID' })
  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminCommentsService.deleteComment(id);
  }

  @ApiOperation({
    summary: '批量删除评论',
    operationId: 'batchDeleteAdminComments',
  })
  @ApiOkResponse({ description: '批量删除成功' })
  @Post('comments/batch-delete')
  async batchDeleteComments(@Body() dto: BatchDeleteCommentsDto) {
    return this.adminCommentsService.batchDeleteComments(dto);
  }
}
