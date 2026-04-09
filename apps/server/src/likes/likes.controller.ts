import {
  Controller,
  Post,
  Get,
  Param,
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
  BlogLikedStatusResponseDto,
  BlogLikesCountResponseDto,
  ToggleLikeResponseDto,
} from '../common/dto/responses/blog.response.dto';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('likes')
@Controller('blogs/:blogId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换博客点赞状态' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: ToggleLikeResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  toggleLike(
    @Param('blogId') blogId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.likesService.toggleLike(+blogId, req?.user?.userId);
  }

  @ApiOperation({ summary: '获取博客点赞数量' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: BlogLikesCountResponseDto })
  @Get('count')
  getLikesCount(@Param('blogId') blogId: string) {
    return this.likesService.getLikesCount(+blogId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '查询当前用户是否已点赞' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: BlogLikedStatusResponseDto })
  @UseGuards(JwtAuthGuard)
  @Get('status')
  hasLiked(
    @Param('blogId') blogId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.likesService.hasLiked(+blogId, req?.user?.userId);
  }
}
