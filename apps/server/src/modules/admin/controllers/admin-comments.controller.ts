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
import { ApiTags } from '@nestjs/swagger';
import { AdminCommentsService } from '../services/admin-comments.service';
import {
  CommentManageQueryDto,
  BatchDeleteCommentsDto,
} from '../dto/comment-manage.dto';
import { AdminGuard } from '../guards/admin.guard';

@ApiTags('管理后台')
@UseGuards(AuthGuard('admin-jwt'), AdminGuard)
@Controller('admin')
export class AdminCommentsController {
  constructor(private readonly adminCommentsService: AdminCommentsService) {}

  @Get('comments/blog')
  async getBlogComments(@Query() query: CommentManageQueryDto) {
    return this.adminCommentsService.getBlogComments(query);
  }

  @Get('comments/topic')
  async getTopicComments(@Query() query: CommentManageQueryDto) {
    return this.adminCommentsService.getTopicComments(query);
  }

  @Get('comments')
  async getComments(@Query() query: CommentManageQueryDto) {
    return this.adminCommentsService.getComments(query);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id', ParseIntPipe) id: number) {
    return this.adminCommentsService.deleteComment(id);
  }

  @Post('comments/batch-delete')
  async batchDeleteComments(@Body() dto: BatchDeleteCommentsDto) {
    return this.adminCommentsService.batchDeleteComments(dto);
  }
}
