import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { TencentCaptchaService } from './tencent-captcha.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendCodeDto } from './dto/login-by-code.dto';
import { MailService } from './mail.service';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15分钟

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private redisService: RedisService,
    private tencentCaptchaService: TencentCaptchaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    access_token: string;
    user: Partial<User>;
  }> {
    const { username, email, password, nickname } = registerDto;

    // 检查用户名和邮箱是否已存在
    const existingUser = await this.usersService.findByUsernameOrEmail(
      username,
      email,
    );
    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === email) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 创建用户（nickname 可选，没填则随机生成）
    const user = await this.usersService.create(
      username,
      password,
      email,
      nickname,
    );

    this.logger.log(
      `新用户注册: ${username} (${email}), 昵称: ${user.nickname}`,
    );

    // 返回JWT token
    return await this.generateToken(user);
  }

  async login(
    loginDto: LoginDto,
    ip?: string,
  ): Promise<{
    access_token: string;
    user: Partial<User>;
  }> {
    const { username, password } = loginDto;

    try {
      await this.tencentCaptchaService.verifyTicket({
        ticket: loginDto.captchaTicket,
        randstr: loginDto.captchaRandstr,
        userIp: ip || '127.0.0.1',
      });
      // 支持用用户名或邮箱登录
      let user: User;
      try {
        user = await this.usersService.findByUsername(username);
      } catch {
        // username 查找失败，尝试邮箱
        const byEmail = await this.usersService.findByEmail(username);
        if (!byEmail) {
          throw new UnauthorizedException('用户名或密码错误');
        }
        user = byEmail;
      }

      // 检查账户状态
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('账户已被禁用');
      }

      // 检查账户是否被锁定
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 1000 / 60,
        );
        throw new UnauthorizedException(
          `账户已被锁定，请 ${remainingTime} 分钟后重试`,
        );
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password || '',
      );

      if (!isPasswordValid) {
        await this.handleLoginFailure(user);
        throw new UnauthorizedException('用户名或密码错误');
      }

      // 登录成功，重置失败计数
      await this.handleLoginSuccess(user, ip);

      this.logger.log(`用户登录成功: ${username} from ${ip || 'unknown'}`);

      return await this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `登录失败: ${username}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnauthorizedException('登录失败');
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.validateUser(username, password);
      if (user) {
        return user;
      }
      return null;
    } catch {
      return null;
    }
  }

  // 发送邮箱验证码
  async sendVerificationCode(
    sendCodeDto: SendCodeDto,
    ip?: string,
  ): Promise<{ message: string }> {
    await this.tencentCaptchaService.verifyTicket({
      ticket: sendCodeDto.captchaTicket,
      randstr: sendCodeDto.captchaRandstr,
      userIp: ip || '127.0.0.1',
    });

    const { email } = sendCodeDto;
    let user = await this.usersService.findByEmail(email);

    // 首次邮箱注册：如果邮箱不存在则自动建号（随机昵称）
    if (!user) {
      const maxAttempts = 5;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // 用户名仅允许英文字母和数字，用邮箱前缀生成并补充随机字母避免冲突
        const localPart = (email.split('@')[0] || email).replace(
          /[^a-zA-Z0-9]/g,
          '',
        );
        const base = localPart.length > 0 ? localPart : 'user';

        const randomLetters = (len: number) => {
          const alphabet =
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
          let out = '';
          for (let i = 0; i < len; i++) {
            out += alphabet[Math.floor(Math.random() * alphabet.length)];
          }
          return out;
        };

        const suffixLen = Math.min(6, Math.max(0, 20 - base.length));
        const candidateBase = base.slice(0, 20);
        const candidate =
          attempt === 0
            ? candidateBase.length >= 3
              ? candidateBase
              : (candidateBase + randomLetters(3 - candidateBase.length)).slice(
                  0,
                  20,
                )
            : `${base.slice(0, Math.max(0, 20 - suffixLen))}${randomLetters(Math.max(1, suffixLen))}`.slice(
                0,
                20,
              );

        try {
          user = await this.usersService.create(
            candidate,
            // 仅用于占位，实际登录走邮箱验证码
            uuidv4(),
            email,
            undefined,
          );
          break;
        } catch (err: unknown) {
          // 可能用户名被占用：换一个候选继续尝试
          if (err instanceof ConflictException) {
            continue;
          }
          throw err;
        }
      }

      if (!user) {
        throw new UnauthorizedException('无法为该邮箱完成首次注册，请稍后重试');
      }
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效

    await this.usersService.updateUser(user);

    try {
      await this.mailService.sendVerificationCode(email, code);
    } catch (mailErr) {
      // SMTP 未配置时降级：将验证码打印到日志，便于开发调试
      this.logger.warn(
        `邮件发送失败（请检查 SMTP 配置），验证码 [${code}] 已保存，可在此处查看 —— 邮箱: ${email}`,
        mailErr instanceof Error ? mailErr.message : String(mailErr),
      );
    }

    return { message: '验证码已发送' };
  }

  // 邮箱验证码登录
  async loginByCode(
    email: string,
    code: string,
    ip?: string,
  ): Promise<{
    access_token: string;
    user: {
      id: number;
      username: string;
      email: string;
      avatar: string | null;
      bio: string | null;
      status: UserStatus;
      lastLoginAt: Date | null;
    };
  }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('该邮箱未注册');
    }

    const now = new Date();
    const cleanCode = code?.trim();

    if (!user.verificationCode || user.verificationCode !== cleanCode) {
      this.logger.warn(
        `验证码错误: 邮箱 ${email}, 预期 ${user.verificationCode}, 实际收到 ${cleanCode}`,
      );
      throw new UnauthorizedException('验证码不正确');
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < now) {
      this.logger.warn(
        `验证码已过期: 邮箱 ${email}, 过期时间 ${user.verificationCodeExpires.toISOString()}, 当前时间 ${now.toISOString()}`,
      );
      throw new UnauthorizedException('验证码已过期');
    }

    // 验证成功后清除验证码
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await this.handleLoginSuccess(user, ip);

    return await this.generateToken(user);
  }

  // 请求密码重置
  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('该邮箱未注册');
    }

    const token = uuidv4();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600 * 1000); // 1小时有效

    await this.usersService.updateUser(user);
    await this.mailService.sendResetPasswordLink(email, token);
    return { message: '重置密码链接已发送到您的邮箱' };
  }

  // 重置密码
  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new UnauthorizedException('重置令牌无效或已过期');
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.usersService.updateUser(user);
    return { message: '密码已成功重置' };
  }

  private async handleLoginFailure(user: User): Promise<void> {
    user.loginFailureCount += 1;

    if (user.loginFailureCount >= this.MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + this.LOCKOUT_TIME);
      this.logger.warn(`用户 ${user.username} 登录失败次数过多，账户已被锁定`);
    }

    await this.usersService.updateUser(user);
  }

  private async handleLoginSuccess(user: User, ip?: string): Promise<void> {
    user.loginFailureCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;

    await this.usersService.updateUser(user);
  }

  async generateToken(user: User): Promise<{
    access_token: string;
    user: {
      id: number;
      username: string;
      nickname: string | null;
      email: string;
      avatar: string | null;
      bio: string | null;
      status: UserStatus;
      lastLoginAt: Date | null;
    };
  }> {
    const payload = { username: user.username, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    // 将 token 存入 Redis，TTL 30 天（滑动窗口）
    await this.redisService.storeToken(access_token, user.id);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || null,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }
}
