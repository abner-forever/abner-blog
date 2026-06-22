import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  discovery,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  randomState,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  buildEndSessionUrl,
  allowInsecureRequests,
  Configuration,
  ClientSecretBasic,
} from 'openid-client';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'node:crypto';

/**
 * SSOOidcService — OIDC 协议核心
 */
@Injectable()
export class SSOOidcService implements OnModuleInit {
  private readonly logger = new Logger(SSOOidcService.name);

  private config: Configuration | null = null;
  private issuerUrl: string;
  private clientId: string;
  private clientSecret: string;
  private callbackUrl: string;

  private jwksKeys: Record<string, crypto.KeyObject> | null = null;
  private jwksExpiresAt = 0;
  private readonly jwksCacheTtlMs = 60 * 60 * 1000;

  constructor(private configService: ConfigService) {
    this.issuerUrl =
      this.configService.get<string>('KEYCLOAK_ISSUER_URL') || '';
    this.clientId = this.configService.get<string>('SSO_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('SSO_CLIENT_SECRET') || '';
    this.callbackUrl = this.configService.get<string>('SSO_CALLBACK_URL') || '';
  }

  async onModuleInit() {
    if (!this.isConfigured()) {
      this.logger.warn('SSO OIDC 未配置，OIDC 服务不可用');
      return;
    }
    try {
      await this.discoverAndCreateClient();
    } catch (err) {
      this.logger.error(
        `OIDC 初始化失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  isConfigured(): boolean {
    return !!(this.issuerUrl && this.clientId && this.clientSecret);
  }

  private async discoverAndCreateClient() {
    this.config = await discovery(
      new URL(this.issuerUrl),
      this.clientId,
      {
        client_secret: this.clientSecret,
        redirect_uris: [this.callbackUrl],
        token_endpoint_auth_method: 'client_secret_basic',
      },
      ClientSecretBasic(this.clientSecret),
      {
        execute: [allowInsecureRequests],
      },
    );
    this.logger.log(`OIDC Issuer 发现成功: ${this.issuerUrl}`);
  }

  private getConfig(): Configuration {
    if (!this.config) {
      throw new Error('OIDC Client 未初始化，请检查 Keycloak 连接配置');
    }
    return this.config;
  }

  generateCodeVerifier(): string {
    return randomPKCECodeVerifier();
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    return calculatePKCECodeChallenge(verifier);
  }

  generateState(): string {
    return randomState();
  }

  generateAuthorizationUrl(state: string, codeChallenge: string): string {
    return buildAuthorizationUrl(this.getConfig(), {
      redirect_uri: this.callbackUrl,
      scope: 'openid email profile',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).href;
  }

  /**
   * 用授权码交换 Token
   * @param requestUrl - 完整的回调请求 URL（含 code / state / iss 等 Keycloak 追加的参数）
   */
  async exchangeCodeForTokens(
    requestUrl: string,
    codeVerifier: string,
    expectedState: string,
  ) {
    const config = this.getConfig();
    const url = new URL(requestUrl);

    try {
      const tokenSet = await authorizationCodeGrant(config, url, {
        pkceCodeVerifier: codeVerifier,
        expectedState,
      });
      return tokenSet;
    } catch (err) {
      this.logger.error(
        `authorizationCodeGrant 失败: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  async validateIdToken(
    idToken: string,
  ): Promise<jwt.JwtPayload & { preferred_username?: string; name?: string }> {
    const keyMap = await this.fetchJwksKeys();
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new Error('ID Token 格式无效');
    }
    const kid = decoded.header.kid;
    const key = kid ? keyMap[kid] : Object.values(keyMap)[0];
    if (!key) {
      throw new Error(`未找到匹配的 JWK key (kid=${kid})`);
    }
    const serverMetadata = this.getConfig().serverMetadata() as {
      issuer?: string;
    };
    const issuer = serverMetadata?.issuer || this.issuerUrl;
    const payload = jwt.verify(idToken, key, {
      algorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384'],
      issuer,
      audience: this.clientId,
    });
    return payload as jwt.JwtPayload;
  }

  async fetchJwksKeys(): Promise<Record<string, crypto.KeyObject>> {
    const now = Date.now();
    if (this.jwksKeys && now < this.jwksExpiresAt) {
      return this.jwksKeys;
    }
    const config = this.getConfig();
    const metadata = config.serverMetadata() as { jwks_uri?: string };
    const jwksUri = metadata?.jwks_uri;
    if (!jwksUri) {
      throw new Error('无法获取 JWKS URI 从 OpenID 配置');
    }
    const response = await axios.get<{ keys: Record<string, unknown>[] }>(
      jwksUri,
    );
    const keyMap: Record<string, crypto.KeyObject> = {};
    for (const jwk of response.data.keys) {
      try {
        const keyObject = crypto.createPublicKey({
          format: 'jwk',
          key: jwk as crypto.JsonWebKey,
        });
        const kid = (jwk.kid as string) || 'default';
        keyMap[kid] = keyObject;
      } catch (err) {
        const kidStr = typeof jwk.kid === 'string' ? jwk.kid : 'unknown';
        this.logger.warn(
          `JWK 转换失败 (kid=${kidStr}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    this.jwksKeys = keyMap;
    this.jwksExpiresAt = now + this.jwksCacheTtlMs;
    return keyMap;
  }

  getKeycloakLogoutUrl(idTokenHint?: string): string {
    const params: Record<string, string> = {
      post_logout_redirect_uri: 'http://localhost:3001/login',
    };
    if (idTokenHint) {
      params.id_token_hint = idTokenHint;
    }
    return buildEndSessionUrl(this.getConfig(), params).href;
  }
}
