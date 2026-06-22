import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  Query,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { SSOOidcService } from '../services/sso-oidc.service';
import { SSOSessionService } from '../services/sso-session.service';
import { SSOUserMappingService } from '../services/sso-user-mapping.service';
import { RedisService } from '../../../redis/redis.service';
import { SSO_STATE_PREFIX } from '../sso.constants';

@ApiTags('SSO 单点登录')
@Controller('sso')
export class SSOAuthController {
  private readonly logger = new Logger(SSOAuthController.name);

  constructor(
    private readonly ssoOidcService: SSOOidcService,
    private readonly ssoSessionService: SSOSessionService,
    private readonly ssoUserMappingService: SSOUserMappingService,
    private readonly redisService: RedisService,
  ) {}

  @ApiOperation({ summary: '发起 SSO 登录（重定向到 Keycloak）' })
  @ApiQuery({
    name: 'redirectTo',
    required: false,
    description: '登录成功后重定向地址（默认管理后台）',
  })
  @Get('authorize')
  async authorize(
    @Res() res: Response,
    @Query('redirectTo') redirectTo?: string,
  ) {
    if (!this.ssoOidcService.isConfigured()) {
      return res
        .status(503)
        .json({ success: false, message: 'SSO 服务未配置' });
    }

    const state = this.ssoOidcService.generateState();
    const codeVerifier = this.ssoOidcService.generateCodeVerifier();
    const codeChallenge =
      await this.ssoOidcService.generateCodeChallenge(codeVerifier);

    const statePayload = JSON.stringify({
      codeVerifier,
      redirectTo: redirectTo || null,
    });
    await this.redisService.set(
      `${SSO_STATE_PREFIX}${state}`,
      statePayload,
      600,
    );

    const authUrl = this.ssoOidcService.generateAuthorizationUrl(
      state,
      codeChallenge,
    );
    this.logger.log(`SSO 授权跳转: state=${state}`);
    return res.redirect(authUrl);
  }

  @ApiOperation({ summary: 'SSO 回调（Keycloak 认证后重定向至此）' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      return res
        .status(400)
        .json({ success: false, message: '缺少 code 或 state 参数' });
    }

    try {
      // 1. 验证 state
      const stateKey = `${SSO_STATE_PREFIX}${state}`;
      const stateRaw = await this.redisService.get(stateKey);
      if (!stateRaw) {
        return res
          .status(401)
          .json({ success: false, message: 'state 无效或已过期，请重新登录' });
      }
      await this.redisService.del(stateKey);

      let codeVerifier: string;
      let redirectTo: string | null = null;
      try {
        const statePayload = JSON.parse(stateRaw) as {
          codeVerifier: string;
          redirectTo?: string | null;
        };
        codeVerifier = statePayload.codeVerifier;
        redirectTo = statePayload.redirectTo || null;
      } catch {
        return res
          .status(400)
          .json({ success: false, message: 'state 数据格式错误' });
      }

      // 2. 用完整回调 URL 交换 Token（openid-client 需要完整 URL 提取 code/state/redirect_uri）
      const requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const tokenSet = await this.ssoOidcService.exchangeCodeForTokens(
        requestUrl,
        codeVerifier,
        state,
      );

      const idToken = tokenSet.id_token;
      if (!idToken) {
        return res
          .status(400)
          .json({ success: false, message: '未获取到 ID Token' });
      }

      // 3. 验证 ID Token
      const claims = await this.ssoOidcService.validateIdToken(idToken);

      // 4. 查找或创建本地用户
      const user = await this.ssoUserMappingService.findOrCreateLocalUser({
        sub: claims.sub,
        email: claims.email as string | undefined,
        preferred_username: (claims as Record<string, unknown>)
          .preferred_username as string | undefined,
        name: (claims as Record<string, unknown>).name as string | undefined,
      });

      // 5. 创建 Redis 会话
      const sessionId = await this.ssoSessionService.createSession(
        user.id,
        user.username,
        user.role,
        claims.sub,
        ((claims as Record<string, unknown>).email as string) || '',
      );

      // 6. Set-Cookie + 重定向回管理后台
      const cookieName = this.ssoSessionService.getCookieName();
      const cookieOptions = this.ssoSessionService.getCookieOptions();
      res.cookie(cookieName, sessionId, cookieOptions);

      this.logger.log(
        `SSO 登录成功: userId=${user.id}, username=${user.username}, redirectTo=${redirectTo}`,
      );
      return res.redirect(redirectTo || 'http://localhost:3001');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SSO 登录失败';
      this.logger.error(`SSO 回调处理失败: ${message}`);
      // 直接返回 JSON，不依赖 res.json（避免和全局拦截器冲突）
      res.status(500);
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, message }));
    }
  }

  @ApiOperation({ summary: 'SSO 登出' })
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res() res: Response) {
    const cookieName = this.ssoSessionService.getCookieName();
    const sessionId = (req.cookies as Record<string, string>)?.[cookieName];

    if (sessionId) {
      await this.ssoSessionService.deleteSession(sessionId);
    }

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: this.ssoSessionService.getCookieOptions().secure,
      sameSite: 'lax' as const,
      path: '/api',
    });

    // 构建 Keycloak 端登出 URL，让前端跳转以终止 Keycloak 会话
    let redirectUrl: string | undefined;
    try {
      redirectUrl = this.ssoOidcService.getKeycloakLogoutUrl();
    } catch (err) {
      this.logger.warn(
        `获取 Keycloak 登出 URL 失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.logger.log(`SSO 登出成功: sessionId=${sessionId}`);
    return res.json({ success: true, message: '登出成功', redirectUrl });
  }

  @ApiOperation({ summary: '获取 SSO 登录状态' })
  @Get('status')
  async status(@Req() req: Request) {
    const cookieName = this.ssoSessionService.getCookieName();
    const sessionId = (req.cookies as Record<string, string>)?.[cookieName];

    if (!sessionId) return { authenticated: false };

    const sessionData = await this.ssoSessionService.getSession(sessionId);
    if (!sessionData) return { authenticated: false };

    return {
      authenticated: true,
      userId: sessionData.userId,
      username: sessionData.username,
      role: sessionData.role,
      email: sessionData.email,
    };
  }
}
