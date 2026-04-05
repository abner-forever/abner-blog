import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dto/login.dto';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentAdmin } from '../decorators/current-admin.decorator';

@ApiTags('管理后台')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({ summary: '初始化管理员' })
  @Post('init-admin')
  async initAdmin() {
    return this.adminAuthService.initAdmin();
  }

  @Post('auth/login')
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminAuthService.login(loginDto);
  }

  @UseGuards(AuthGuard('admin-jwt'), AdminGuard)
  @Get('auth/profile')
  async getProfile(@CurrentAdmin('userId') userId: number) {
    return this.adminAuthService.getProfile(userId);
  }
}
