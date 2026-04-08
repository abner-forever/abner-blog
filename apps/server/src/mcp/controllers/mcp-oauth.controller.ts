import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AuthService } from '../../auth/auth.service';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../../users/users.service';
import {
  MCP_OAUTH_ALLOWED_CODE_CHALLENGE_METHODS,
  MCP_OAUTH_ALLOWED_REDIRECT_URIS,
  MCP_OAUTH_DEFAULT_CLIENT_ID,
  MCP_OAUTH_STATE_MAX_LENGTH,
} from '../constants';
import { McpOauthService } from '../services';

interface OAuthAuthorizeQuery {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
}

interface OAuthApproveBody {
  clientId?: string;
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

interface OAuthTokenBody {
  grant_type?: string;
  code?: string;
  redirect_uri?: string;
  client_id?: string;
  code_verifier?: string;
}

@Controller('mcp')
export class McpOauthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly oauthService: McpOauthService,
  ) {}

  @Get('.well-known/oauth-authorization-server')
  metadata(@Req() req: Request) {
    const issuer = `${req.protocol}://${req.get('host')}/api/mcp`;
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      registration_endpoint: `${issuer}/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256', 'plain'],
      token_endpoint_auth_methods_supported: ['none'],
    };
  }

  @Post('oauth/register')
  registerClient() {
    return {
      client_id: 'cursor-local',
      client_name: 'Cursor MCP Client',
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
      redirect_uris: MCP_OAUTH_ALLOWED_REDIRECT_URIS,
    };
  }

  @Get('oauth/authorize')
  authorize(@Query() query: OAuthAuthorizeQuery, @Res() res: Response): void {
    if (query.response_type !== 'code') {
      throw new BadRequestException('unsupported response_type');
    }
    if (!query.client_id || !query.redirect_uri || !query.code_challenge) {
      throw new BadRequestException(
        'missing client_id/redirect_uri/code_challenge',
      );
    }
    if (query.client_id !== MCP_OAUTH_DEFAULT_CLIENT_ID) {
      throw new BadRequestException('unsupported client_id');
    }
    if (!MCP_OAUTH_ALLOWED_REDIRECT_URIS.includes(query.redirect_uri)) {
      throw new BadRequestException('unsupported redirect_uri');
    }
    if (
      query.code_challenge_method &&
      !MCP_OAUTH_ALLOWED_CODE_CHALLENGE_METHODS.includes(
        query.code_challenge_method,
      )
    ) {
      throw new BadRequestException('unsupported code_challenge_method');
    }
    if (query.state && query.state.length > MCP_OAUTH_STATE_MAX_LENGTH) {
      throw new BadRequestException('state is too long');
    }

    const webBaseUrl = this.getWebBaseUrl();
    const connectUrl = new URL('/mcp/login', webBaseUrl);
    connectUrl.searchParams.set('client_id', query.client_id);
    connectUrl.searchParams.set('redirect_uri', query.redirect_uri);
    connectUrl.searchParams.set('code_challenge', query.code_challenge);
    connectUrl.searchParams.set(
      'code_challenge_method',
      query.code_challenge_method ?? 'S256',
    );
    if (query.state) {
      connectUrl.searchParams.set('state', query.state);
    }
    res.redirect(connectUrl.toString());
  }

  private getWebBaseUrl(): string {
    const webBaseUrl =
      this.configService.get<string>('WEB_URL') ??
      this.configService.get<string>('web_URL');
    if (!webBaseUrl) {
      throw new InternalServerErrorException(
        'WEB_URL is not configured on server',
      );
    }
    return webBaseUrl;
  }

  @Post('oauth/approve')
  async approve(
    @Req() req: Request,
    @Body() body: OAuthApproveBody,
  ): Promise<{ redirectTo: string; code: string }> {
    const userId = await this.resolveUserIdFromRequest(req);
    if (!body.clientId || !body.redirectUri || !body.codeChallenge) {
      throw new BadRequestException(
        'missing clientId/redirectUri/codeChallenge',
      );
    }
    if (body.clientId !== MCP_OAUTH_DEFAULT_CLIENT_ID) {
      throw new BadRequestException('unsupported clientId');
    }
    if (!MCP_OAUTH_ALLOWED_REDIRECT_URIS.includes(body.redirectUri)) {
      throw new BadRequestException('unsupported redirectUri');
    }
    if (
      body.codeChallengeMethod &&
      !MCP_OAUTH_ALLOWED_CODE_CHALLENGE_METHODS.includes(
        body.codeChallengeMethod,
      )
    ) {
      throw new BadRequestException('unsupported codeChallengeMethod');
    }
    if (body.state && body.state.length > MCP_OAUTH_STATE_MAX_LENGTH) {
      throw new BadRequestException('state is too long');
    }

    const code = this.oauthService.issueAuthorizationCode({
      userId,
      clientId: body.clientId,
      redirectUri: body.redirectUri,
      codeChallenge: body.codeChallenge,
      codeChallengeMethod: body.codeChallengeMethod ?? 'S256',
    });

    const redirectUrl = new URL(body.redirectUri);
    redirectUrl.searchParams.set('code', code);
    if (body.state) {
      redirectUrl.searchParams.set('state', body.state);
    }

    return {
      redirectTo: redirectUrl.toString(),
      code,
    };
  }

  @Post('oauth/token')
  async token(@Body() body: OAuthTokenBody) {
    if (body.grant_type !== 'authorization_code') {
      throw new BadRequestException('unsupported grant_type');
    }
    if (!body.code || !body.client_id || !body.redirect_uri) {
      throw new BadRequestException('missing code/client_id/redirect_uri');
    }
    if (body.client_id !== MCP_OAUTH_DEFAULT_CLIENT_ID) {
      throw new UnauthorizedException('invalid_client');
    }
    if (!MCP_OAUTH_ALLOWED_REDIRECT_URIS.includes(body.redirect_uri)) {
      throw new UnauthorizedException('invalid_redirect_uri');
    }

    const record = this.oauthService.consumeAuthorizationCode(body.code);
    if (!record) {
      throw new UnauthorizedException('invalid_or_expired_code');
    }
    if (
      record.clientId !== body.client_id ||
      record.redirectUri !== body.redirect_uri
    ) {
      throw new UnauthorizedException('invalid_client_or_redirect_uri');
    }

    const ok = this.oauthService.verifyPkce(
      body.code_verifier ?? '',
      record.codeChallenge,
      record.codeChallengeMethod,
    );
    if (!ok) {
      throw new UnauthorizedException('invalid_code_verifier');
    }

    const user = await this.usersService.findById(record.userId);
    const token = await this.authService.generateToken(user);

    return {
      access_token: token.access_token,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 60 * 60,
    };
  }

  private async resolveUserIdFromRequest(req: Request): Promise<number> {
    const authHeader =
      req.headers.authorization ?? req.headers.Authorization ?? '';
    const authHeaderStr = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;
    if (!authHeaderStr?.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing bearer token');
    }

    const token = authHeaderStr.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('missing bearer token');
    }

    const payload = this.jwtService.verify<{ sub: number }>(token, {
      ignoreExpiration: true,
    });
    if (!payload?.sub) {
      throw new UnauthorizedException('invalid token payload');
    }

    const valid = await this.redisService.isTokenValid(token);
    if (!valid) {
      throw new UnauthorizedException('token expired');
    }
    await this.redisService.refreshTokenTTL(token);

    return payload.sub;
  }
}
