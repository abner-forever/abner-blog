import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { WebSearchService } from '../../web-search/web-search.service';

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface McpBearerJwtPayload {
  sub: number | string;
  typ?: string;
}

@Controller('mcp/web-search')
export class McpWebSearchController {
  private readonly logger = new Logger(McpWebSearchController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly webSearch: WebSearchService,
  ) {}

  @Get()
  health() {
    return {
      status: 'ok',
      endpoint: '/api/mcp/web-search',
      methods: ['POST'],
      message: 'Web Search MCP endpoint is ready. Use POST for JSON-RPC calls.',
    };
  }

  @Post()
  @HttpCode(200)
  async handle(
    @Body() body: JsonRpcRequest,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const rpcId = body?.id ?? null;

    try {
      const authError = this.validateServerAuth(req);
      if (authError) {
        this.sendError(res, rpcId, -32001, authError);
        return;
      }

      const method = body?.method || '';
      if (method === 'initialize') {
        res.setHeader('mcp-session-id', `web-search-${Date.now()}`);
        res.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: { tools: {} },
            serverInfo: { name: 'abner-blog-web-search-mcp', version: '1.0.0' },
          },
        });
        return;
      }

      if (method === 'notifications/initialized') {
        res.status(204).end();
        return;
      }

      if (method === 'tools/list') {
        res.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            tools: [
              {
                name: 'search',
                description:
                  '使用服务端配置的 Tavily 或 Brave 进行联网检索，返回摘要与网页摘录',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: '检索关键词或问题' },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'get_page_content',
                description:
                  '抓取指定 http(s) 公开网页，返回去除 HTML 标签后的正文片段（有 SSRF 基本限制）',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', description: '页面 URL' },
                  },
                  required: ['url'],
                },
              },
            ],
          },
        });
        return;
      }

      if (method === 'tools/call') {
        const params = (body.params || {}) as {
          name?: string;
          arguments?: Record<string, unknown>;
        };
        const toolName = params.name || '';
        const args = params.arguments || {};
        let text: string;
        if (toolName === 'search') {
          const query = this.asString(args.query);
          text = await this.webSearch.searchDigest(query);
        } else if (toolName === 'get_page_content') {
          const url = this.asString(args.url);
          text = await this.webSearch.fetchPagePreview(url);
        } else {
          throw new Error(`不支持的工具: ${toolName}`);
        }
        res.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            content: [{ type: 'text', text }],
          },
        });
        return;
      }

      this.sendError(res, rpcId, -32601, `不支持的方法: ${method}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`MCP web-search request failed: ${message}`);
      this.sendError(res, rpcId, -32000, message);
    }
  }

  private validateServerAuth(req: Request): string | null {
    const expected =
      this.configService.get<string>('MCP_SERVER_BEARER_TOKEN') || '';
    if (!expected) return null;
    const authHeader = req.headers.authorization;
    let auth = '';
    if (typeof authHeader === 'string') {
      auth = authHeader;
    } else if (Array.isArray(authHeader) && typeof authHeader[0] === 'string') {
      auth = authHeader[0];
    }
    if (auth === `Bearer ${expected}`) {
      return null;
    }
    if (!auth?.startsWith('Bearer ')) {
      return 'Unauthorized';
    }
    const token = auth.slice(7).trim();
    if (!token) return 'Unauthorized';
    try {
      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'your-secret-key-please-change-in-production';
      const payload = this.jwtService.verify<McpBearerJwtPayload>(token, {
        secret,
      });
      const sub = Number(payload.sub);
      if (
        payload.sub === undefined ||
        payload.sub === null ||
        String(payload.sub).length === 0 ||
        Number.isNaN(sub)
      ) {
        return 'Unauthorized';
      }
      if (payload.typ === 'refresh') return 'Unauthorized';
      if (payload.typ !== undefined && payload.typ !== 'access') {
        return 'Unauthorized';
      }
      return null;
    } catch {
      return 'Unauthorized';
    }
  }

  private sendError(
    res: Response,
    id: string | number | null,
    code: number,
    message: string,
  ): void {
    res.json({
      jsonrpc: '2.0',
      id,
      error: { code, message },
    });
  }

  private asString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return `${value}`;
    }
    return '';
  }
}
