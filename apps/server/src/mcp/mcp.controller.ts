import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { McpService } from './mcp.service';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

interface ToolInfo {
  name: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: any;
}

@Controller('mcp')
export class McpController implements OnApplicationBootstrap {
  private readonly logger = new Logger(McpController.name);
  private transport: StreamableHTTPServerTransport;
  private connected = false;

  constructor(private readonly mcpService: McpService) {}

  async onApplicationBootstrap() {
    // 创建一个共享的 transport，所有 session 复用
    // 使用 stateful 模式，sessionIdGenerator 返回固定值让所有请求属于同一 session
    this.transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => 'shared-session',
    });

    const server = this.mcpService.getServer();
    await server.connect(this.transport);
    this.connected = true;
    this.logger.log('MCP Server connected to shared HTTP transport');
  }

  /**
   * 处理 MCP 请求 (HTTP POST)
   * 标准的 MCP 协议端点
   */
  @Post()
  handleMcpRequest(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    if (!this.connected) {
      res.status(503).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Server not ready' },
        id: null,
      });
      return;
    }

    // MCP transport 直接处理响应，不返回任何值
    const requestBody = body as Record<string, unknown>;
    this.logger.debug(`MCP request: ${JSON.stringify(requestBody)}`);

    // 处理请求但不等待（让 transport 异步处理）
    this.transport.handleRequest(req, res, requestBody).then(
      () => {
        this.logger.debug('MCP request completed');
      },
      (error) => {
        this.logger.error(`MCP request error: ${error}`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message:
                error instanceof Error ? error.message : 'Internal error',
            },
            id: null,
          });
        }
      },
    );
  }

  /**
   * 获取可用工具列表 (GET)
   * 用于调试和客户端发现工具
   */
  @Get('tools')
  listTools(): { tools: ToolInfo[] } {
    const tools = this.mcpService.listTools();
    return {
      tools: tools.map((tool) => {
        const info: ToolInfo = {
          name: tool.name,
          description: tool.description,
          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          inputSchema: tool.inputSchema,
        };
        return info;
      }),
    };
  }

  /**
   * 健康检查端点
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      server: 'abner-blog-mcp-server',
      version: '1.0.0',
    };
  }
}
