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
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  MomentDto,
  MomentListResponseDto,
  ToggleMomentLikeResponseDto,
  ToggleMomentFavoriteResponseDto,
} from '../common/dto/responses/moment.response.dto';
import { CommentDto } from '../common/dto/responses/comment.response.dto';
import { MomentsService } from './moments.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { SearchMomentDto } from './dto/search-moment.dto';
import { CreateMomentCommentDto } from './dto/create-moment-comment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('moments')
@Controller('moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '创建沸点' })
  @ApiResponse({ status: 201, type: MomentDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createMomentDto: CreateMomentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.momentsService.create(createMomentDto, req.user.userId);
  }

  @ApiOperation({ summary: '获取沸点列表' })
  @ApiResponse({ status: 200, type: MomentListResponseDto })
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async findAll(
    @Query() searchDto: SearchMomentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId;
    return await this.momentsService.findAll(searchDto, userId);
  }

  @ApiOperation({ summary: '获取沸点详情' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @ApiResponse({ status: 200, type: MomentDto })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return this.momentsService.findOne(+id, userId, ip);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '删除沸点' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.momentsService.remove(+id, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '更新沸点' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @ApiResponse({ status: 200, type: MomentDto })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMomentDto: UpdateMomentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.momentsService.update(+id, updateMomentDto, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换沸点点赞状态' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @ApiResponse({ status: 200, type: ToggleMomentLikeResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.momentsService.toggleLike(+id, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换沸点收藏状态' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @ApiResponse({ status: 200, type: ToggleMomentFavoriteResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  toggleFavorite(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.momentsService.toggleFavorite(+id, req.user.userId);
  }

  @ApiOperation({ summary: '获取沸点评论列表' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @ApiResponse({ status: 200, type: [CommentDto] })
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  getComments(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.momentsService.getComments(+id, req.user?.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '创建沸点评论' })
  @ApiParam({ name: 'id', description: '沸点 ID' })
  @ApiResponse({ status: 201, type: CommentDto })
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateMomentCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.momentsService.createComment(
      +id,
      createCommentDto,
      req.user.userId,
    );
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '删除沸点评论' })
  @ApiParam({ name: 'commentId', description: '评论 ID' })
  @UseGuards(JwtAuthGuard)
  @Delete('comments/:commentId')
  removeComment(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.momentsService.removeComment(+commentId, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换沸点评论点赞状态' })
  @ApiParam({ name: 'commentId', description: '评论 ID' })
  @UseGuards(JwtAuthGuard)
  @Post('comments/:commentId/like')
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.momentsService.toggleCommentLike(+commentId, req.user.userId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取我收藏的沸点列表' })
  @UseGuards(JwtAuthGuard)
  @Get('favorites/my')
  getFavorites(@Req() req: AuthenticatedRequest) {
    return this.momentsService.getFavorites(req.user.userId);
  }
}
