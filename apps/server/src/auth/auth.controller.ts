import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AuthTokenResponseDto,
  UserProfileDto,
} from '../common/dto/responses/user.response.dto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import { SendCodeDto, LoginByCodeDto } from './dto/login-by-code.dto';
import { TencentCaptchaService } from './tencent-captcha.service';
import { CaptchaConfigResponseDto } from './dto/captcha-config.response.dto';

interface AuthenticatedRequest extends Request {
  user: User;
}

interface JwtRequest extends Request {
  user: { userId: number; username: string };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private redisService: RedisService,
    private tencentCaptchaService: TencentCaptchaService,
  ) {}

  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({
    status: 201,
    type: AuthTokenResponseDto,
    description: '注册成功，返回 token 和用户信息',
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: '是否启用腾讯云验证码及 AppId（公开）' })
  @ApiResponse({ status: 200, type: CaptchaConfigResponseDto })
  @Get('captcha-config')
  captchaConfig(): CaptchaConfigResponseDto {
    return this.tencentCaptchaService.getPublicConfig();
  }

  @ApiOperation({ summary: '用户名密码登录' })
  @ApiResponse({
    status: 200,
    type: AuthTokenResponseDto,
    description: '登录成功，返回 token 和用户信息',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    return this.authService.login(loginDto, ip);
  }

  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @Post('send-code')
  async sendCode(@Body() sendCodeDto: SendCodeDto, @Ip() ip: string) {
    return this.authService.sendVerificationCode(sendCodeDto, ip);
  }

  @ApiOperation({ summary: '邮箱验证码登录' })
  @ApiResponse({
    status: 200,
    type: AuthTokenResponseDto,
    description: '登录成功，返回 token 和用户信息',
  })
  @HttpCode(HttpStatus.OK)
  @Post('login-code')
  async loginByCode(@Body() loginByCodeDto: LoginByCodeDto, @Ip() ip: string) {
    return this.authService.loginByCode(
      loginByCodeDto.email,
      loginByCodeDto.code,
      ip,
    );
  }

  @ApiOperation({ summary: '请求重置密码（发送邮件）' })
  @ApiResponse({ status: 200, description: '重置邮件发送成功' })
  @Post('request-reset')
  async requestReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto.email);
  }

  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @ApiOperation({ summary: '传统本地策略登录（已废弃）' })
  @UseGuards(LocalAuthGuard)
  @Post('login-legacy')
  async loginLegacy(@Request() req: AuthenticatedRequest) {
    return this.authService.generateToken(req.user);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '登出，主动使 token 失效' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: JwtRequest) {
    const authHeader: string =
      (req.headers as unknown as Record<string, string>)?.authorization ||
      (req.headers as unknown as Record<string, string>)?.Authorization ||
      '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token) {
      await this.redisService.revokeToken(token);
    }
    return { message: '已成功登出' };
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    type: UserProfileDto,
    description: '当前登录用户信息',
  })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: JwtRequest) {
    const user = await this.usersService.findById(req.user.userId);
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || null,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    };
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '刷新 Token' })
  @ApiResponse({
    status: 200,
    type: AuthTokenResponseDto,
    description: '刷新后的 token 和用户信息',
  })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refresh(@Request() req: JwtRequest) {
    const user = await this.usersService.findById(req.user.userId);
    return this.authService.generateToken(user);
  }
}
