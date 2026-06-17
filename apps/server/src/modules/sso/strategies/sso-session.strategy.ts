import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { SSOSessionService } from '../services/sso-session.service';
import { SSO_COOKIE_NAME } from '../sso.constants';

/**
 * 自定义 Passport 策略基类
 *
 * 用于从 Cookie 中提取 sessionId 并验证。
 * 遵循 Passport 策略接口。
 * success / fail / error 方法由 Passport 框架在 authenticate 时注入。
 */
class SSOCookieStrategy {
  static strategyName = 'sso-session';
  name = 'sso-session';
  private _verify: (sessionId: string | null, done: (err: any, user: any, info?: any) => void) => void;
  private _cookieName: string;

  constructor(
    options: { cookieName?: string },
    verify: (sessionId: string | null, done: (err: any, user: any, info?: any) => void) => void,
  ) {
    this._cookieName = options.cookieName || SSO_COOKIE_NAME;
    this._verify = verify;
  }

  authenticate(req: any) {
    const sessionId = req.cookies?.[this._cookieName];

    const done = (err: any, user: any, info?: any) => {
      if (err) {
        return (this as any).error(err);
      }
      if (!user) {
        return (this as any).fail(info || { message: 'SSO session invalid' }, 401);
      }
      return (this as any).success(user, info);
    };

    try {
      this._verify(sessionId || null, done);
    } catch (ex) {
      return (this as any).error(ex instanceof Error ? ex : new Error(String(ex)));
    }
  }
}

/**
 * SSOSessionStrategy — Passport 策略
 *
 * 从 `sso_session` Cookie 中读取 sessionId，
 * 查 Redis 验证会话有效性，返回用户信息注入 req.user。
 * 策略名 'sso-session'，可与 admin-jwt 并用实现双认证。
 */
@Injectable()
export class SSOSessionStrategy extends PassportStrategy(SSOCookieStrategy, 'sso-session') {
  private readonly logger = new Logger(SSOSessionStrategy.name);

  constructor(private ssoSessionService: SSOSessionService) {
    super({ cookieName: SSO_COOKIE_NAME });
  }

  /**
   * validate 由 @nestjs/passport 的 verify 回调调用
   * @param sessionId - Cookie 中的会话 ID（可能为 null）
   * @returns 用户对象（注入 req.user）或 null
   */
  async validate(sessionId: string | null) {
    if (!sessionId) {
      return null;
    }

    const sessionData = await this.ssoSessionService.getSession(sessionId);

    if (!sessionData) {
      this.logger.debug(`SSO session 无效或已过期: sessionId=${sessionId}`);
      return null;
    }

    return {
      userId: sessionData.userId,
      username: sessionData.username,
      role: sessionData.role,
    };
  }
}
