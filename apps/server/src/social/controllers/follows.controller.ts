import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FollowsService } from '../services/follows.service';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import {
  FollowListResponseDto,
  FollowStatusResponseDto,
} from '../dto/social-response.dto';

@ApiTags('social')
@Controller('users')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '关注用户' })
  @ApiParam({ name: 'id', description: '被关注用户 ID' })
  @ApiResponse({ status: 200, description: '关注成功' })
  async follow(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) followingId: number,
  ): Promise<{ following: boolean }> {
    return this.followsService.follow(req.user.userId, followingId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '取消关注' })
  @ApiParam({ name: 'id', description: '被取消关注的用户 ID' })
  async unfollow(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) followingId: number,
  ): Promise<{ following: boolean }> {
    return this.followsService.unfollow(req.user.userId, followingId);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: '粉丝列表' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, type: FollowListResponseDto })
  async followers(
    @Param('id', ParseIntPipe) userId: number,
    @Query() q: PaginationQueryDto,
  ) {
    return this.followsService.listFollowers(
      userId,
      q.page ?? 1,
      q.pageSize ?? 20,
    );
  }

  @Get(':id/following')
  @ApiOperation({ summary: '关注列表' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, type: FollowListResponseDto })
  async following(
    @Param('id', ParseIntPipe) userId: number,
    @Query() q: PaginationQueryDto,
  ) {
    return this.followsService.listFollowing(
      userId,
      q.page ?? 1,
      q.pageSize ?? 20,
    );
  }

  @Get(':id/follow-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '当前用户与该用户的关注状态' })
  @ApiParam({ name: 'id', description: '对方用户 ID' })
  @ApiResponse({ status: 200, type: FollowStatusResponseDto })
  async followStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) targetUserId: number,
  ): Promise<{ following: boolean; followedBy: boolean }> {
    const [following, followedBy] = await Promise.all([
      this.followsService.isFollowing(req.user.userId, targetUserId),
      this.followsService.isFollowing(targetUserId, req.user.userId),
    ]);
    return { following, followedBy };
  }
}
