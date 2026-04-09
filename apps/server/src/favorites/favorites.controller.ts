import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  BlogFavoritedStatusResponseDto,
  BlogFavoritesCountResponseDto,
  ToggleFavoriteResponseDto,
  BlogDto,
} from '../common/dto/responses/blog.response.dto';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';

@ApiTags('favorites')
@Controller('blogs/:blogId/favorites')
export class FavoritesController {
  private readonly logger = new Logger(FavoritesController.name);

  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '切换博客收藏状态' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: ToggleFavoriteResponseDto })
  @UseGuards(JwtAuthGuard)
  @Post()
  toggleFavorite(
    @Param('blogId') blogId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.debug('Request user:', req.user);
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户未登录');
    }
    return this.favoritesService.toggleFavorite(+blogId, userId);
  }

  @ApiOperation({ summary: '获取博客收藏数量' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: BlogFavoritesCountResponseDto })
  @Get('count')
  getFavoritesCount(@Param('blogId') blogId: string) {
    return this.favoritesService.getFavoritesCount(+blogId);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '查询当前用户是否已收藏' })
  @ApiParam({ name: 'blogId', description: '博客 ID' })
  @ApiResponse({ status: 200, type: BlogFavoritedStatusResponseDto })
  @UseGuards(JwtAuthGuard)
  @Get('status')
  hasFavorited(
    @Param('blogId') blogId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.debug('Request user:', req.user);
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('用户未登录');
    }
    return this.favoritesService.hasFavorited(+blogId, userId);
  }
}

@ApiTags('favorites')
@Controller('/favorites')
export class UserFavoritesController {
  private readonly logger = new Logger(UserFavoritesController.name);

  constructor(private readonly favoritesService: FavoritesService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取当前用户收藏的博客列表' })
  @ApiResponse({ status: 200, type: [BlogDto] })
  @UseGuards(JwtAuthGuard)
  @Get()
  getUserFavorites(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.favoritesService.getUserFavorites(userId);
  }
}
