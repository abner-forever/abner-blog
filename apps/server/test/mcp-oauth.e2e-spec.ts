import type { Server } from 'http';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  McpOauthCompatController,
  McpOauthService,
} from '../src/mcp/oauth';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';

describe('MCP OAuth Compat (e2e)', () => {
  let app: INestApplication;
  let oauthService: McpOauthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [McpOauthCompatController],
      providers: [
        McpOauthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'JWT_ACCESS_EXPIRES_IN' ? '15m' : undefined,
            ),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(async (id: number) => ({
              id,
              username: `user-${id}`,
            })),
          },
        },
        {
          provide: AuthService,
          useValue: {
            generateTokenPair: jest.fn(async () => ({
              access_token: 'mock_access_token',
              refresh_token: 'mock_refresh_token',
            })),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    oauthService = moduleFixture.get(McpOauthService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /register returns oauth dynamic client metadata', async () => {
    const res = await request(app.getHttpServer() as Server)
      .post('/register')
      .expect(201);

    expect(res.body).toMatchObject({
      client_id: 'cursor-local',
      token_endpoint_auth_method: 'none',
    });
    expect(Array.isArray(res.body.redirect_uris)).toBe(true);
  });

  it('POST /token returns token for valid authorization_code + PKCE', async () => {
    const code = oauthService.issueAuthorizationCode({
      userId: 1,
      clientId: 'cursor-local',
      redirectUri: 'cursor://mcp-auth-callback',
      codeChallenge: 'valid_verifier',
      codeChallengeMethod: 'plain',
    });

    const res = await request(app.getHttpServer() as Server)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: 'cursor-local',
        redirect_uri: 'cursor://mcp-auth-callback',
        code,
        code_verifier: 'valid_verifier',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'Bearer',
      expires_in: 900,
    });
  });

  it('POST /token rejects invalid or expired code', async () => {
    const res = await request(app.getHttpServer() as Server)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: 'cursor-local',
        redirect_uri: 'cursor://mcp-auth-callback',
        code: 'expired_or_invalid_code',
        code_verifier: 'whatever',
      })
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'invalid_grant',
    });
  });

  it('POST /token rejects PKCE mismatch', async () => {
    const code = oauthService.issueAuthorizationCode({
      userId: 1,
      clientId: 'cursor-local',
      redirectUri: 'cursor://mcp-auth-callback',
      codeChallenge: 'expected_verifier',
      codeChallengeMethod: 'plain',
    });

    const res = await request(app.getHttpServer() as Server)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: 'cursor-local',
        redirect_uri: 'cursor://mcp-auth-callback',
        code,
        code_verifier: 'wrong_verifier',
      })
      .expect(401);

    expect(res.body).toMatchObject({
      error: 'invalid_grant',
      error_description: 'invalid code_verifier',
    });
  });
});
