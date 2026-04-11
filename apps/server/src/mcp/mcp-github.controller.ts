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

@Controller('mcp/github')
export class McpGithubController {
  private readonly logger = new Logger(McpGithubController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  health() {
    return {
      status: 'ok',
      endpoint: '/api/mcp/github',
      methods: ['POST'],
      message: 'GitHub MCP endpoint is ready. Use POST for JSON-RPC calls.',
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
        res.setHeader('mcp-session-id', `github-${Date.now()}`);
        res.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: { tools: {} },
            serverInfo: { name: 'abner-blog-github-mcp', version: '1.0.0' },
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
                name: 'get_repo',
                description: '获取 GitHub 仓库信息',
                inputSchema: {
                  type: 'object',
                  properties: {
                    owner: { type: 'string' },
                    repo: { type: 'string' },
                  },
                  required: ['owner', 'repo'],
                },
              },
              {
                name: 'list_issues',
                description: '列出仓库 Issue',
                inputSchema: {
                  type: 'object',
                  properties: {
                    owner: { type: 'string' },
                    repo: { type: 'string' },
                    state: { type: 'string', enum: ['open', 'closed', 'all'] },
                    per_page: { type: 'number' },
                  },
                  required: ['owner', 'repo'],
                },
              },
              {
                name: 'create_issue',
                description: '创建 Issue',
                inputSchema: {
                  type: 'object',
                  properties: {
                    owner: { type: 'string' },
                    repo: { type: 'string' },
                    title: { type: 'string' },
                    body: { type: 'string' },
                  },
                  required: ['owner', 'repo', 'title'],
                },
              },
              {
                name: 'list_prs',
                description: '列出仓库 PR',
                inputSchema: {
                  type: 'object',
                  properties: {
                    owner: { type: 'string' },
                    repo: { type: 'string' },
                    state: { type: 'string', enum: ['open', 'closed', 'all'] },
                    per_page: { type: 'number' },
                  },
                  required: ['owner', 'repo'],
                },
              },
              {
                name: 'create_pr',
                description: '创建 PR',
                inputSchema: {
                  type: 'object',
                  properties: {
                    owner: { type: 'string' },
                    repo: { type: 'string' },
                    title: { type: 'string' },
                    head: { type: 'string' },
                    base: { type: 'string' },
                    body: { type: 'string' },
                  },
                  required: ['owner', 'repo', 'title', 'head', 'base'],
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
        const result = await this.callGithubTool(
          toolName,
          params.arguments || {},
        );
        const displayText = this.formatGithubResultForDisplay(toolName, result);
        res.json({
          jsonrpc: '2.0',
          id: rpcId,
          result: {
            content: [{ type: 'text', text: displayText }],
            structuredContent:
              result && typeof result === 'object' && !Array.isArray(result)
                ? (result as Record<string, unknown>)
                : undefined,
          },
        });
        return;
      }

      this.sendError(res, rpcId, -32601, `不支持的方法: ${method}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`MCP github request failed: ${message}`);
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

  private async callGithubTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    if (toolName === 'get_repo') {
      return this.githubRequest(
        `/repos/${this.asString(args.owner)}/${this.asString(args.repo)}`,
      );
    }
    if (toolName === 'list_issues') {
      const state = this.asString(args.state) || 'open';
      const perPage = this.asNumber(args.per_page) || 20;
      return this.githubRequest(
        `/repos/${this.asString(args.owner)}/${this.asString(args.repo)}/issues?state=${encodeURIComponent(state)}&per_page=${perPage}`,
      );
    }
    if (toolName === 'create_issue') {
      return this.githubRequest(
        `/repos/${this.asString(args.owner)}/${this.asString(args.repo)}/issues`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: this.asString(args.title),
            body: this.asString(args.body),
          }),
        },
      );
    }
    if (toolName === 'list_prs') {
      const state = this.asString(args.state) || 'open';
      const perPage = this.asNumber(args.per_page) || 20;
      return this.githubRequest(
        `/repos/${this.asString(args.owner)}/${this.asString(args.repo)}/pulls?state=${encodeURIComponent(state)}&per_page=${perPage}`,
      );
    }
    if (toolName === 'create_pr') {
      return this.githubRequest(
        `/repos/${this.asString(args.owner)}/${this.asString(args.repo)}/pulls`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: this.asString(args.title),
            body: this.asString(args.body),
            head: this.asString(args.head),
            base: this.asString(args.base),
          }),
        },
      );
    }
    throw new Error(`不支持的工具: ${toolName}`);
  }

  /** 聊天展示用 Markdown；完整数据仍在 structuredContent（单对象工具） */
  private formatGithubResultForDisplay(
    toolName: string,
    result: unknown,
  ): string {
    switch (toolName) {
      case 'get_repo':
        return this.formatRepoSummary(result);
      case 'list_issues':
        return this.formatIssueList(result);
      case 'list_prs':
        return this.formatPullRequestList(result);
      case 'create_issue':
        return this.formatCreatedIssue(result);
      case 'create_pr':
        return this.formatCreatedPullRequest(result);
      default:
        return typeof result === 'string'
          ? result
          : JSON.stringify(result, null, 2);
    }
  }

  private formatRepoSummary(data: unknown): string {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return JSON.stringify(data, null, 2);
    }
    const r = data as Record<string, unknown>;
    const fullName = this.asString(r.full_name);
    const desc = this.asString(r.description).trim() || '（无描述）';
    const url = this.asString(r.html_url);
    const lang = this.asString(r.language) || '—';
    const stars = this.asDisplayNumber(r.stargazers_count);
    const forks = this.asDisplayNumber(r.forks_count);
    const openIssues = this.asDisplayNumber(r.open_issues_count);
    const branch = this.asString(r.default_branch) || '—';
    const updated = this.asString(r.updated_at) || '—';
    const visibility = r.private === true ? '私有' : '公开';
    const homepage =
      typeof r.homepage === 'string' && r.homepage.trim()
        ? r.homepage.trim()
        : '';

    const lines = [
      `### ${fullName}`,
      '',
      desc,
      '',
      `- 仓库链接：${url}`,
      `- 可见性：${visibility}`,
      `- 主语言：${lang}`,
      `- 默认分支：${branch}`,
      `- ⭐ Star ${stars} · Fork ${forks} · Open issues ${openIssues}`,
      `- 最近更新：${updated}`,
    ];
    if (homepage) {
      lines.push(`- 主页：${homepage}`);
    }
    return lines.join('\n');
  }

  private formatIssueList(data: unknown): string {
    if (!Array.isArray(data)) {
      return JSON.stringify(data, null, 2);
    }
    if (data.length === 0) {
      return '当前没有符合条件的 Issue。';
    }
    const lines: string[] = ['### Issues', ''];
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const num = this.asDisplayNumber(o.number);
      const title = this.asString(o.title);
      const state = this.asString(o.state);
      const url = this.asString(o.html_url);
      let author = '';
      if (o.user && typeof o.user === 'object' && o.user !== null) {
        const u = o.user as { login?: string };
        if (typeof u.login === 'string') author = u.login;
      }
      lines.push(
        `- **#${num}** [${title}](${url}) · ${state}${author ? ` · @${author}` : ''}`,
      );
    }
    return lines.join('\n');
  }

  private formatPullRequestList(data: unknown): string {
    if (!Array.isArray(data)) {
      return JSON.stringify(data, null, 2);
    }
    if (data.length === 0) {
      return '当前没有符合条件的 Pull Request。';
    }
    const lines: string[] = ['### Pull Requests', ''];
    for (const item of data) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const num = this.asDisplayNumber(o.number);
      const title = this.asString(o.title);
      const state = this.asString(o.state);
      const url = this.asString(o.html_url);
      const draft = o.draft === true ? '（草稿）' : '';
      lines.push(`- **#${num}** [${title}](${url}) · ${state}${draft}`);
    }
    return lines.join('\n');
  }

  private formatCreatedIssue(data: unknown): string {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return JSON.stringify(data, null, 2);
    }
    const o = data as Record<string, unknown>;
    const num = this.asDisplayNumber(o.number);
    const url = this.asString(o.html_url);
    const title = this.asString(o.title);
    return `已创建 Issue [#${num}](${url})：${title}`;
  }

  private formatCreatedPullRequest(data: unknown): string {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return JSON.stringify(data, null, 2);
    }
    const o = data as Record<string, unknown>;
    const num = this.asDisplayNumber(o.number);
    const url = this.asString(o.html_url);
    const title = this.asString(o.title);
    return `已创建 Pull Request [#${num}](${url})：${title}`;
  }

  private async githubRequest(
    path: string,
    init?: RequestInit,
  ): Promise<unknown> {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN') || '';
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN 未配置');
    }
    const response = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    const data: unknown = await response.json();
    if (!response.ok) {
      const message =
        typeof data === 'object' &&
        data &&
        'message' in data &&
        typeof (data as { message?: unknown }).message === 'string'
          ? (data as { message: string }).message
          : `GitHub API 调用失败(${response.status})`;
      throw new Error(message);
    }
    return data;
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

  private asNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined;
  }

  private asDisplayNumber(value: unknown): string {
    return typeof value === 'number' && Number.isFinite(value)
      ? `${value}`
      : '—';
  }
}
