import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dto/login.dto';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';
import { AuthTokenResponseDto } from '../../../common/dto/responses/user.response.dto';

@ApiExtraModels(AuthTokenResponseDto)
@ApiTags('管理后台 - 认证')
@ApiBearerAuth('JWT')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({
    summary: '初始化管理员（首次调用创建默认管理员）',
    operationId: 'initAdmin',
  })
  @ApiCreatedResponse({ description: '初始化成功' })
  @Post('init-admin')
  async initAdmin() {
    return this.adminAuthService.initAdmin();
  }

  @ApiOperation({ summary: '管理员登录', operationId: 'adminLogin' })
  @ApiOkResponse({ type: AuthTokenResponseDto, description: '登录成功' })
  @Post('auth/login')
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminAuthService.login(loginDto);
  }

  @ApiOperation({
    summary: '获取当前管理员信息',
    operationId: 'getAdminProfile',
  })
  @ApiOkResponse({ type: AuthTokenResponseDto, description: '管理员信息' })
  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('auth/profile')
  async getProfile(@CurrentAdmin('userId') userId: number) {
    return this.adminAuthService.getProfile(userId);
  }
}
