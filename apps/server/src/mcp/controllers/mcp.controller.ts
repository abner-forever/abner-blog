import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  Logger,
  OnApplicationBootstrap,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import {
  McpRequestContextService,
  McpService,
  McpSessionAuthService,
} from '../services';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { JsonRpcRequest, ToolInfo } from '../types';

@Controller('mcp')
export class McpController implements OnApplicationBootstrap {
  private readonly logger = new Logger(McpController.name);
  private transport: StreamableHTTPServerTransport;
  private connected = false;

  constructor(
    private readonly mcpService: McpService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly requestContext: McpRequestContextService,
    private readonly sessionAuthService: McpSessionAuthService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.reconnectTransport();
  }

  private async reconnectTransport(): Promise<void> {
    const server = this.mcpService.getServer();

    if (this.connected) {
      await server.close();
      this.connected = false;
      this.logger.debug('Previous MCP transport closed');
    }

    // 使用 stateful session，每次 initialize 生成唯一会话。
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
    });

    await server.connect(this.transport);
    this.connected = true;
    this.logger.log('MCP Server connected to HTTP transport');
  }

  @Post()
  async handleMcpRequest(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.connected) {
      res.status(503).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Server not ready' },
        id: null,
      });
      return;
    }

    const requestBody = body as Record<string, unknown>;
    this.logger.debug(`MCP request: ${JSON.stringify(requestBody)}`);

    if (requestBody.method === 'initialize') {
      delete req.headers['mcp-session-id'];
      await this.reconnectTransport();
    }

    try {
      const userId = await this.resolveUserIdFromRequest(req);
      const sessionId = this.getSessionIdFromRequest(req);
      const rpcReq = requestBody as JsonRpcRequest;

      if (!userId) {
        this.sendAuthChallenge(req, res, rpcReq.id ?? null);
        return;
      }

      await this.requestContext.run({ userId, sessionId }, async () => {
        await this.transport.handleRequest(req, res, requestBody);
      });
      this.logger.debug('MCP request completed');
    } catch (error) {
      this.logger.error(`MCP request error: ${String(error)}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : 'Internal error',
          },
          id: null,
        });
      }
    }
  }

  @Get()
  async handleMcpStream(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.connected) {
      res.status(503).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Server not ready' },
        id: null,
      });
      return;
    }

    try {
      const userId = await this.resolveUserIdFromRequest(req);
      const sessionId = this.getSessionIdFromRequest(req);
      if (!userId) {
        this.sendAuthChallenge(req, res, null);
        return;
      }

      await this.requestContext.run({ userId, sessionId }, async () => {
        await this.transport.handleRequest(req, res);
      });
    } catch (error) {
      this.logger.error(`MCP stream request error: ${String(error)}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : 'Internal error',
          },
          id: null,
        });
      }
    }
  }

  @Delete()
  async handleMcpSessionDelete(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.connected) {
      res.status(204).end();
      return;
    }
    await this.transport.handleRequest(req, res);
  }

  private sendAuthChallenge(
    req: Request,
    res: Response,
    id: string | number | null,
  ): void {
    const issuer = `${req.protocol}://${req.get('host')}/api/mcp`;
    const metadataUrl = `${issuer}/.well-known/oauth-authorization-server`;
    const authorizeUrl = `${issuer}/oauth/authorize`;
    res.setHeader(
      'WWW-Authenticate',
      `Bearer authorization_uri="${authorizeUrl}", resource_metadata="${metadataUrl}"`,
    );
    res.status(401).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32001,
        message: 'Authentication required',
        data: {
          authorization_uri: authorizeUrl,
          resource_metadata: metadataUrl,
        },
      },
    });
  }

  private async resolveUserIdFromRequest(req: Request): Promise<number | null> {
    const sessionId = this.getSessionIdFromRequest(req);

    const authHeader =
      req.headers.authorization ?? req.headers.Authorization ?? '';
    const authHeaderStr = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;

    if (!authHeaderStr?.startsWith('Bearer ')) {
      if (sessionId) {
        return await this.sessionAuthService.getSessionUser(sessionId);
      }
      return null;
    }

    const token = authHeaderStr.slice(7).trim();
    if (!token) {
      if (sessionId) {
        return await this.sessionAuthService.getSessionUser(sessionId);
      }
      return null;
    }

    try {
      const payload = this.jwtService.verify<{ sub: number }>(token, {
        ignoreExpiration: true,
      });

      if (!payload?.sub || Number.isNaN(payload.sub)) {
        throw new UnauthorizedException('无效的 Token');
      }

      const isValid = await this.redisService.isTokenValid(token);
      if (!isValid) {
        throw new UnauthorizedException('登录已过期，请重新登录');
      }
      await this.redisService.refreshTokenTTL(token);

      return payload.sub;
    } catch (error) {
      if (sessionId) {
        return await this.sessionAuthService.getSessionUser(sessionId);
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('无效的 Token');
    }
  }

  private getSessionIdFromRequest(req: Request): string | null {
    const header = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(header) ? header[0] : header;
    return typeof sessionId === 'string' && sessionId.length > 0
      ? sessionId
      : null;
  }

  @Get('tools')
  listTools(): { tools: ToolInfo[] } {
    const tools = this.mcpService.listTools();
    return {
      tools: tools.map((tool) => {
        const info: ToolInfo = {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        };
        return info;
      }),
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      server: 'abner-blog-mcp-server',
      version: '1.0.0',
    };
  }
}
