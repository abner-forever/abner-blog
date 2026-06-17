import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * SSOSessionGuard — Cookie 会话守卫
 *
 * 使用 Passport 的 'sso-session' 策略验证
 * 从 sso_session Cookie 中提取 sessionId 并查 Redis。
 *
 * 可与 admin-jwt 并用实现双认证模式：
 * @UseGuards(AuthGuard(['admin-jwt', 'sso-session']), AdminGuard)
 */
@Injectable()
export class SSOSessionGuard extends AuthGuard('sso-session') {}
