import {
  Controller,
  Body,
  Get,
  Param,
  UseGuards,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { UserProfileDto } from '../common/dto/responses/user.response.dto';
import { UserResumeDto } from '../common/dto/responses/user-resume.response.dto';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { userId: number };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '获取用户公开信息' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserProfileDto> {
    const user = await this.usersService.findById(+id);
    // 只返回公开字段，不暴露密码、token 等敏感数据
    // 优先显示昵称，没有则显示用户名
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || null,
      email: user.email,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '更新当前用户资料' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const user = await this.usersService.updateProfile(
      req.user.userId,
      updateProfileDto,
    );
    // 返回完整的用户公开信息
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || null,
      email: user.email,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @ApiOperation({ summary: '获取用户简历' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 200, type: UserResumeDto })
  @Get(':id/resume')
  async getResume(@Param('id') id: string): Promise<UserResumeDto> {
    const user = await this.usersService.getResume(+id);
    return this.usersService.transformToResumeDto(user);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '更新当前用户简历' })
  @ApiResponse({ status: 200, type: UserResumeDto })
  @UseGuards(JwtAuthGuard)
  @Patch('resume')
  async updateResume(
    @Request() req: AuthenticatedRequest,
    @Body() updateResumeDto: UpdateResumeDto,
  ): Promise<UserResumeDto> {
    const user = await this.usersService.updateResume(
      req.user.userId,
      updateResumeDto,
    );
    return this.usersService.transformToResumeDto(user);
  }
}
