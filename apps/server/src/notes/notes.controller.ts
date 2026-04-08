import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { SearchNoteDto } from './dto/search-note.dto';
import { CreateNoteCommentDto } from './dto/create-note-comment.dto';
import {
  NestedCommentDto,
  NoteDto,
  NoteFavoriteItemDto,
  NoteListResponseDto,
} from './dto/note-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
import { CommentDto, ToggleCommentLikeResponseDto } from '../common/dto/responses/comment.response.dto';

@ApiTags('notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '创建笔记' })
  @ApiResponse({ status: 201, type: NoteDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createNoteDto: CreateNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notesService.create(createNoteDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取笔记列表' })
  @ApiResponse({ status: 200, type: NoteListResponseDto })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(
    @Query() searchDto: SearchNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    return await this.notesService.findAll(searchDto, userId);
  }

  @ApiOperation({ summary: '获取笔记详情' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiResponse({ status: 200, type: NoteDto })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    return this.notesService.findOne(+id, userId, ip);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '删除笔记' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notesService.remove(+id, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换笔记点赞状态' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notesService.toggleLike(+id, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换笔记收藏状态' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notesService.toggleFavorite(+id, req.user.userId);
  }

  @ApiOperation({ summary: '获取笔记评论列表（嵌套结构）' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiResponse({ status: 200, type: NestedCommentDto, isArray: true })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  getComments(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    return this.notesService.getComments(+id, userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '创建笔记评论' })
  @ApiParam({ name: 'id', description: '笔记 ID' })
  @ApiResponse({ status: 201, type: CommentDto })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateNoteCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notesService.createComment(
      +id,
      createCommentDto,
      req.user.userId,
    );
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '删除笔记评论' })
  @ApiParam({ name: 'commentId', description: '评论 ID' })
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  removeComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notesService.removeComment(+commentId, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换评论点赞状态' })
  @ApiParam({ name: 'commentId', description: '评论 ID' })
  @ApiResponse({ status: 200, type: ToggleCommentLikeResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post('comments/:commentId/like')
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notesService.toggleCommentLike(+commentId, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取我收藏的笔记列表' })
  @ApiResponse({ status: 200, type: NoteFavoriteItemDto, isArray: true })
  @UseGuards(JwtAuthGuard)
  @Get('favorites/my')
  getFavorites(@Req() req: AuthenticatedRequest) {
    return this.notesService.getFavorites(req.user.userId);
  }
}
