import {
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  Get,
  Body,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/auth.service';
import { jwtExpiresInToSeconds } from '../../auth/utils/jwt-expires.util';
import { UsersService } from '../../users/users.service';
import {
  MCP_OAUTH_ALLOWED_REDIRECT_URIS,
  MCP_OAUTH_DEFAULT_CLIENT_ID,
} from './mcp-oauth.constants';
import { McpOauthService } from './mcp-oauth.service';
import { Request, Response } from 'express';

@Controller()
export class McpOauthCompatController {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly oauthService: McpOauthService,
  ) {}

  @Get('authorize')
  authorizeCompat(@Req() req: Request, @Res() res: Response): void {
    const host = `${req.protocol}://${req.get('host')}`;
    const target = new URL('/api/mcp/oauth/authorize', host);
    Object.entries(req.query).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'
          ) {
            target.searchParams.append(key, String(item));
          }
        });
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        target.searchParams.set(key, String(value));
      }
    });
    res.redirect(target.toString());
  }

  @Post('register')
  registerClientCompat(@Res() res: Response): void {
    res.status(201).json({
      client_id: MCP_OAUTH_DEFAULT_CLIENT_ID,
      client_name: 'Cursor MCP Client',
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
      redirect_uris: MCP_OAUTH_ALLOWED_REDIRECT_URIS,
    });
  }

  @Post('token')
  async tokenCompat(
    @Body()
    body: {
      grant_type?: string;
      code?: string;
      redirect_uri?: string;
      client_id?: string;
      code_verifier?: string;
    },
    @Res() res: Response,
  ): Promise<void> {
    if (body.grant_type !== 'authorization_code') {
      this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'unsupported_grant_type',
        'only authorization_code is supported',
      );
      return;
    }

    if (!body.code || !body.client_id || !body.redirect_uri) {
      this.sendOAuthError(
        res,
        HttpStatus.BAD_REQUEST,
        'invalid_request',
        'missing code/client_id/redirect_uri',
      );
      return;
    }
    if (body.client_id !== MCP_OAUTH_DEFAULT_CLIENT_ID) {
      this.sendOAuthError(
        res,
        HttpStatus.UNAUTHORIZED,
        'invalid_client',
        'unsupported client_id',
      );
      return;
    }
    if (!MCP_OAUTH_ALLOWED_REDIRECT_URIS.includes(body.redirect_uri)) {
      this.sendOAuthError(
        res,
        HttpStatus.UNAUTHORIZED,
        'invalid_grant',
        'unsupported redirect_uri',
      );
      return;
    }

    const record = this.oauthService.consumeAuthorizationCode(body.code);
    if (!record) {
      this.sendOAuthError(
        res,
        HttpStatus.UNAUTHORIZED,
        'invalid_grant',
        'invalid or expired authorization code',
      );
      return;
    }

    if (
      record.clientId !== body.client_id ||
      record.redirectUri !== body.redirect_uri
    ) {
      this.sendOAuthError(
        res,
        HttpStatus.UNAUTHORIZED,
        'invalid_grant',
        'client_id or redirect_uri does not match',
      );
      return;
    }

    const pkceOk = this.oauthService.verifyPkce(
      body.code_verifier ?? '',
      record.codeChallenge,
      record.codeChallengeMethod,
    );
    if (!pkceOk) {
      this.sendOAuthError(
        res,
        HttpStatus.UNAUTHORIZED,
        'invalid_grant',
        'invalid code_verifier',
      );
      return;
    }

    const user = await this.usersService.findById(record.userId);
    const token = await this.authService.generateTokenPair(user);
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    res.status(HttpStatus.OK).json({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: 'Bearer',
      expires_in: jwtExpiresInToSeconds(accessExpiresIn),
    });
  }

  private sendOAuthError(
    res: Response,
    status: number,
    error: string,
    errorDescription: string,
  ): void {
    res.status(status).json({
      error,
      error_description: errorDescription,
    });
  }
}
