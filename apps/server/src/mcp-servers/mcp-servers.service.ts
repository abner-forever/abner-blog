import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  MCPServer,
  MCPServerStatus,
  MCPServerType,
} from '../entities/mcp-server.entity';
import {
  InstallMCPServerDto,
  UpdateMCPServerDto,
  MCPServerResponseDto,
  MarketplaceMCPServerDto,
} from './dto/mcp-server.dto';
import { McpService } from '../mcp';
import type { ToolCallParams } from '../mcp/types';

type MCPServerCatalogSource = 'builtin' | 'marketplace';

interface MCPServerCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  source: MCPServerCatalogSource;
  defaultConfig?: Record<string, unknown>;
}

interface RemoteMcpConfig {
  url?: string;
  bearerToken?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  protocolVersion?: string;
}

interface McpDiagnoseStep {
  step: 'initialize' | 'tools_list' | 'tools_call';
  ok: boolean;
  detail: string;
}

interface BuiltinGroupMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const BUILTIN_GROUP_META: Record<string, BuiltinGroupMeta> = {
  weather: {
    id: 'weather',
    name: '天气助手',
    description: '查询天气与空气质量（系统内置）',
    icon: 'cloud',
  },
  calendar: {
    id: 'calendar',
    name: '日程助手',
    description: '管理个人日程（系统内置）',
    icon: 'calendar',
  },
  todo: {
    id: 'todo',
    name: '待办助手',
    description: '管理待办事项（系统内置）',
    icon: 'check-square',
  },
};

// 市场 MCP：当前仅为可安装目录元数据，尚未接入真实执行器
const MARKETPLACE_MCP_SERVERS: MCPServerCatalogItem[] = [
  {
    id: 'github',
    name: 'GitHub 集成',
    description: '仓库、Issue、PR 等 GitHub 能力（市场扩展）',
    icon: 'github',
    tools: ['get_repo', 'create_issue', 'list_issues', 'list_prs', 'create_pr'],
    source: 'marketplace',
    defaultConfig: {
      url: 'https://your-server.com/api/mcp/github',
      bearerToken: '',
      timeoutMs: 12000,
      headers: {},
    },
  },
  {
    id: 'slack',
    name: 'Slack 集成',
    description: '消息发送与频道管理能力（市场扩展）',
    icon: 'slack',
    tools: ['send_message', 'list_channels', 'get_channel_info'],
    source: 'marketplace',
  },
  {
    id: 'filesystem',
    name: '文件系统',
    description: '文件读写与目录管理能力（市场扩展）',
    icon: 'folder',
    tools: ['read_file', 'write_file', 'list_directory', 'create_directory'],
    source: 'marketplace',
  },
  {
    id: 'web-search',
    name: '网页检索',
    description: '联网搜索与网页内容抓取能力（市场扩展）',
    icon: 'search',
    tools: ['search', 'get_page_content'],
    source: 'marketplace',
  },
  {
    id: 'database',
    name: '数据库',
    description: 'SQL 查询与表结构读取能力（市场扩展）',
    icon: 'database',
    tools: ['execute_query', 'list_tables', 'describe_table'],
    source: 'marketplace',
  },
  {
    id: 'figma',
    name: 'Figma 集成',
    description: '读取 Figma 设计信息与截图能力（市场扩展）',
    icon: 'figma',
    tools: [
      'get_design_context',
      'get_screenshot',
      'get_metadata',
      'get_figjam',
      'generate_diagram',
    ],
    source: 'marketplace',
  },
];

@Injectable()
export class MCPServersService {
  constructor(
    @InjectRepository(MCPServer)
    private readonly mcpServerRepository: Repository<MCPServer>,
    private readonly mcpService: McpService,
    private readonly jwtService: JwtService,
  ) {}

  async callToolForUser(
    userId: number,
    toolName: string,
    params: ToolCallParams,
  ): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    structuredContent?: Record<string, unknown>;
  }> {
    const servers = await this.mcpServerRepository.find({
      where: { userId, status: MCPServerStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    const targetServer = servers.find((server) =>
      (server.allowedTools || []).includes(toolName),
    );
    if (!targetServer) {
      throw new NotFoundException(
        `未找到可用的 MCP 工具：${toolName}（请先在 MCP 管理中安装并启用）`,
      );
    }

    // 内置 MCP：走本地工具执行器
    if (targetServer.type === MCPServerType.BUILTIN) {
      const result = await this.mcpService.callTool(toolName, params);
      const structuredContent =
        result.structuredContent &&
        typeof result.structuredContent === 'object' &&
        !Array.isArray(result.structuredContent)
          ? (result.structuredContent as Record<string, unknown>)
          : undefined;
      return {
        content: result.content
          .map((item) => {
            if (item.type !== 'text') return null;
            return { type: 'text' as const, text: item.text };
          })
          .filter((item): item is { type: 'text'; text: string } =>
            Boolean(item),
          ),
        structuredContent,
      };
    }

    // 市场/自定义 MCP：按配置转发到远端 MCP 服务器
    return this.callRemoteMcpTool(targetServer, toolName, params, userId);
  }

  async findAll(userId: number): Promise<MCPServerResponseDto[]> {
    const servers = await this.mcpServerRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return servers.map((s) => this.toResponseDto(s));
  }

  async findOne(id: string, userId: number): Promise<MCPServerResponseDto> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }
    return this.toResponseDto(server);
  }

  async install(
    dto: InstallMCPServerDto,
    userId: number,
  ): Promise<MCPServerResponseDto> {
    const catalog = this.buildCatalog();
    const catalogDef = catalog.find((m) => m.id === dto.marketplaceId);

    // Check if already installed
    const existing = await this.mcpServerRepository.findOne({
      where: { userId, marketplaceId: dto.marketplaceId },
    });
    if (existing) {
      // Update existing instead
      existing.name = dto.name || existing.name;
      const shouldApplyDefaultConfig =
        (!existing.config || Object.keys(existing.config).length === 0) &&
        !dto.config;
      existing.config = dto.config
        ? { ...dto.config }
        : shouldApplyDefaultConfig && catalogDef?.defaultConfig
          ? { ...catalogDef.defaultConfig }
          : existing.config;
      existing.allowedTools = dto.allowedTools || existing.allowedTools;
      existing.status = MCPServerStatus.ACTIVE;
      if (catalogDef) {
        existing.type =
          catalogDef.source === 'builtin'
            ? MCPServerType.BUILTIN
            : MCPServerType.MARKETPLACE;
        existing.description = catalogDef.description;
        existing.icon = catalogDef.icon;
      }
      const saved = await this.mcpServerRepository.save(existing);
      return this.toResponseDto(saved);
    }

    const server = this.mcpServerRepository.create({
      userId,
      name: dto.name || catalogDef?.name || dto.marketplaceId,
      description: catalogDef?.description || '',
      icon: catalogDef?.icon || '',
      type:
        catalogDef?.source === 'builtin'
          ? MCPServerType.BUILTIN
          : MCPServerType.MARKETPLACE,
      marketplaceId: dto.marketplaceId,
      config: dto.config
        ? { ...dto.config }
        : catalogDef?.defaultConfig
          ? { ...catalogDef.defaultConfig }
          : {},
      allowedTools: dto.allowedTools || catalogDef?.tools || [],
      status: MCPServerStatus.ACTIVE,
    });

    const saved = await this.mcpServerRepository.save(server);
    return this.toResponseDto(saved);
  }

  async update(
    id: string,
    dto: UpdateMCPServerDto,
    userId: number,
  ): Promise<MCPServerResponseDto> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }

    if (dto.name !== undefined) server.name = dto.name;
    if (dto.config !== undefined) server.config = dto.config;
    if (dto.status !== undefined) server.status = dto.status as MCPServerStatus;
    if (dto.allowedTools !== undefined) server.allowedTools = dto.allowedTools;

    const saved = await this.mcpServerRepository.save(server);
    return this.toResponseDto(saved);
  }

  async uninstall(id: string, userId: number): Promise<void> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }
    await this.mcpServerRepository.remove(server);
  }

  async getCatalog(userId: number): Promise<MarketplaceMCPServerDto[]> {
    // Get user's installed servers
    const installed = await this.mcpServerRepository.find({
      where: { userId },
      select: ['marketplaceId'],
    });
    const installedIds = new Set(installed.map((s) => s.marketplaceId));

    return this.buildCatalog().map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      tools: m.tools,
      source: m.source,
      isInstalled: installedIds.has(m.id),
    }));
  }

  private buildCatalog(): MCPServerCatalogItem[] {
    return [
      ...this.buildBuiltinCatalogFromRuntime(),
      ...MARKETPLACE_MCP_SERVERS,
    ];
  }

  private async callRemoteMcpTool(
    server: MCPServer,
    toolName: string,
    params: ToolCallParams,
    userId: number,
  ): Promise<{
    content: Array<{ type: 'text'; text: string }>;
    structuredContent?: Record<string, unknown>;
  }> {
    const toolArgs = params as Record<string, unknown>;
    const config = (server.config || {}) as RemoteMcpConfig;
    const url = config.url?.trim();
    if (!url) {
      throw new Error(
        `MCP服务器「${server.name}」未配置远端地址（config.url）`,
      );
    }

    const protocolVersion = config.protocolVersion || '2025-03-26';
    const timeoutMs = Math.min(
      Math.max(config.timeoutMs || 12000, 1000),
      30000,
    );
    const headers = this.buildRemoteHeaders(server, config, userId);

    const initRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: 'abner-blog-mcp-client', version: '1.0.0' },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!initRes.ok) {
      throw new Error(`远端 MCP 初始化失败(${initRes.status})`);
    }
    const sessionId = initRes.headers.get('mcp-session-id') || '';
    const callHeaders: Record<string, string> = {
      ...headers,
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
      'mcp-protocol-version': protocolVersion,
    };

    void fetch(url, {
      method: 'POST',
      headers: callHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }).catch(() => undefined);

    const callRes = await fetch(url, {
      method: 'POST',
      headers: callHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: toolArgs,
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!callRes.ok) {
      throw new Error(`远端 MCP 工具调用失败(${callRes.status})`);
    }

    const rawData: unknown = await callRes.json();
    const data = rawData as {
      error?: { message?: string };
      result?: {
        content?: Array<{ type?: string; text?: string }>;
        structuredContent?: unknown;
      };
    };
    if (data.error?.message) {
      throw new Error(data.error.message);
    }
    const content = (data.result?.content || [])
      .map((item) => {
        if (item.type !== 'text') return null;
        return { type: 'text' as const, text: item.text || '' };
      })
      .filter((item): item is { type: 'text'; text: string } => Boolean(item));
    const structuredContent =
      data.result?.structuredContent &&
      typeof data.result.structuredContent === 'object' &&
      !Array.isArray(data.result.structuredContent)
        ? (data.result.structuredContent as Record<string, unknown>)
        : undefined;

    return { content, structuredContent };
  }

  private buildBuiltinCatalogFromRuntime(): MCPServerCatalogItem[] {
    const tools = this.mcpService.listTools().map((tool) => tool.name);
    const groups = new Map<string, string[]>();

    for (const toolName of tools) {
      const groupId = this.resolveBuiltinGroupId(toolName);
      if (!groupId) continue;
      const prev = groups.get(groupId) || [];
      groups.set(groupId, [...prev, toolName]);
    }

    const catalog: MCPServerCatalogItem[] = [];
    for (const [groupId, groupedTools] of groups.entries()) {
      const meta = BUILTIN_GROUP_META[groupId];
      if (!meta || groupedTools.length === 0) continue;
      catalog.push({
        id: meta.id,
        name: meta.name,
        description: meta.description,
        icon: meta.icon,
        tools: groupedTools,
        source: 'builtin',
      });
    }
    return catalog;
  }

  private resolveBuiltinGroupId(
    toolName: string,
  ): keyof typeof BUILTIN_GROUP_META | null {
    if (
      toolName.startsWith('get_weather') ||
      toolName.startsWith('get_air_quality')
    ) {
      return 'weather';
    }
    if (toolName === 'list_events' || toolName.endsWith('_event')) {
      return 'calendar';
    }
    if (toolName === 'list_todos' || toolName.endsWith('_todo')) {
      return 'todo';
    }
    return null;
  }

  async getStatus(
    id: string,
    userId: number,
  ): Promise<{ status: string; lastError?: string }> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }
    return {
      status: server.status,
      lastError: server.lastError || undefined,
    };
  }

  async testConnection(
    id: string,
    userId: number,
    configOverride?: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }

    if (server.type === MCPServerType.BUILTIN) {
      return { success: true, message: '内置 MCP 无需远端连接，状态正常' };
    }

    const targetServer = this.withConfigOverride(server, configOverride);
    const pingTool = (targetServer.allowedTools || [])[0] || undefined;
    const diagnostics = await this.diagnoseRemoteConnection(
      targetServer,
      pingTool,
      userId,
    );
    const failed = diagnostics.steps.find((s) => !s.ok);
    if (failed) {
      return {
        success: false,
        message: `连接测试失败：${failed.step} - ${failed.detail}`,
      };
    }
    return { success: true, message: '远端 MCP 连接测试通过' };
  }

  async syncRemoteTools(
    id: string,
    userId: number,
  ): Promise<{ success: boolean; tools: string[]; message: string }> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }
    if (server.type === MCPServerType.BUILTIN) {
      return {
        success: true,
        tools: server.allowedTools || [],
        message: '内置 MCP 工具由系统自动维护，无需同步',
      };
    }

    const tools = await this.listRemoteTools(server, userId);
    server.allowedTools = tools;
    await this.mcpServerRepository.save(server);
    return {
      success: true,
      tools,
      message: `工具同步成功，共 ${tools.length} 个`,
    };
  }

  async diagnoseConnection(
    id: string,
    userId: number,
    configOverride?: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    message: string;
    steps: McpDiagnoseStep[];
    sampleTool?: string;
  }> {
    const server = await this.mcpServerRepository.findOne({
      where: { id, userId },
    });
    if (!server) {
      throw new NotFoundException('MCP服务器不存在');
    }
    if (server.type === MCPServerType.BUILTIN) {
      return {
        success: true,
        message: '内置 MCP 无需远端连接诊断',
        steps: [
          { step: 'initialize', ok: true, detail: '内置模式，无需远端初始化' },
          { step: 'tools_list', ok: true, detail: '内置工具由系统注册维护' },
          {
            step: 'tools_call',
            ok: true,
            detail: '内置工具可通过本地执行器调用',
          },
        ],
      };
    }
    const targetServer = this.withConfigOverride(server, configOverride);
    const sampleTool = (targetServer.allowedTools || [])[0] || undefined;
    const diagnostics = await this.diagnoseRemoteConnection(
      targetServer,
      sampleTool,
      userId,
    );
    const failed = diagnostics.steps.find((s) => !s.ok);
    return {
      success: !failed,
      message: failed
        ? `诊断失败：${failed.step} - ${failed.detail}`
        : '连接诊断通过',
      steps: diagnostics.steps,
      sampleTool,
    };
  }

  private withConfigOverride(
    server: MCPServer,
    configOverride?: Record<string, unknown>,
  ): MCPServer {
    if (!configOverride) {
      return server;
    }
    return {
      ...server,
      config: {
        ...((server.config || {}) as Record<string, unknown>),
        ...configOverride,
      },
    };
  }

  private async listRemoteTools(
    server: MCPServer,
    userId: number,
  ): Promise<string[]> {
    const config = (server.config || {}) as RemoteMcpConfig;
    const url = config.url?.trim();
    if (!url) {
      throw new Error(
        `MCP服务器「${server.name}」未配置远端地址（config.url）`,
      );
    }
    const protocolVersion = config.protocolVersion || '2025-03-26';
    const timeoutMs = Math.min(
      Math.max(config.timeoutMs || 12000, 1000),
      30000,
    );
    const headers = this.buildRemoteHeaders(server, config, userId);

    const initRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: 'abner-blog-mcp-client', version: '1.0.0' },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!initRes.ok) {
      throw new Error(`远端 MCP 初始化失败(${initRes.status})`);
    }
    const sessionId = initRes.headers.get('mcp-session-id') || '';
    const callHeaders: Record<string, string> = {
      ...headers,
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
      'mcp-protocol-version': protocolVersion,
    };

    void fetch(url, {
      method: 'POST',
      headers: callHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }).catch(() => undefined);

    const listRes = await fetch(url, {
      method: 'POST',
      headers: callHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/list',
        params: {},
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!listRes.ok) {
      throw new Error(`远端 MCP tools/list 失败(${listRes.status})`);
    }
    const rawData: unknown = await listRes.json();
    const data = rawData as {
      error?: { message?: string };
      result?: { tools?: Array<{ name?: string }> };
    };
    if (data.error?.message) {
      throw new Error(data.error.message);
    }
    return (data.result?.tools || [])
      .map((tool) => (typeof tool.name === 'string' ? tool.name : ''))
      .filter((name): name is string => Boolean(name));
  }

  private async diagnoseRemoteConnection(
    server: MCPServer,
    sampleTool?: string,
    userId?: number,
  ): Promise<{ steps: McpDiagnoseStep[] }> {
    const steps: McpDiagnoseStep[] = [];
    const config = (server.config || {}) as RemoteMcpConfig;
    const url = config.url?.trim();
    if (!url) {
      return {
        steps: [
          {
            step: 'initialize',
            ok: false,
            detail: `MCP服务器「${server.name}」未配置远端地址（config.url）`,
          },
        ],
      };
    }
    const protocolVersion = config.protocolVersion || '2025-03-26';
    const timeoutMs = Math.min(
      Math.max(config.timeoutMs || 12000, 1000),
      30000,
    );
    const headers = this.buildRemoteHeaders(server, config, userId);

    let callHeaders: Record<string, string> | null = null;
    try {
      const initRes = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion,
            capabilities: {},
            clientInfo: { name: 'abner-blog-mcp-client', version: '1.0.0' },
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!initRes.ok) {
        steps.push({
          step: 'initialize',
          ok: false,
          detail: `HTTP ${initRes.status}`,
        });
        return { steps };
      }
      const sessionId = initRes.headers.get('mcp-session-id') || '';
      callHeaders = {
        ...headers,
        ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
        'mcp-protocol-version': protocolVersion,
      };
      steps.push({ step: 'initialize', ok: true, detail: 'ok' });
    } catch (error) {
      steps.push({
        step: 'initialize',
        ok: false,
        detail: error instanceof Error ? error.message : 'unknown error',
      });
      return { steps };
    }

    try {
      const listRes = await fetch(url, {
        method: 'POST',
        headers: callHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/list',
          params: {},
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!listRes.ok) {
        steps.push({
          step: 'tools_list',
          ok: false,
          detail: `HTTP ${listRes.status}`,
        });
        return { steps };
      }
      const raw: unknown = await listRes.json();
      const data = raw as { error?: { message?: string } };
      if (data.error?.message) {
        steps.push({
          step: 'tools_list',
          ok: false,
          detail: data.error.message,
        });
        return { steps };
      }
      steps.push({ step: 'tools_list', ok: true, detail: 'ok' });
    } catch (error) {
      steps.push({
        step: 'tools_list',
        ok: false,
        detail: error instanceof Error ? error.message : 'unknown error',
      });
      return { steps };
    }

    if (!sampleTool) {
      steps.push({
        step: 'tools_call',
        ok: true,
        detail: '跳过（未配置 sample tool）',
      });
      return { steps };
    }

    try {
      const callRes = await fetch(url, {
        method: 'POST',
        headers: callHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: { name: sampleTool, arguments: {} },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!callRes.ok) {
        steps.push({
          step: 'tools_call',
          ok: false,
          detail: `HTTP ${callRes.status}`,
        });
        return { steps };
      }
      const raw: unknown = await callRes.json();
      const data = raw as { error?: { message?: string } };
      if (data.error?.message) {
        if (this.isLikelyArgumentError(data.error.message)) {
          steps.push({
            step: 'tools_call',
            ok: true,
            detail: `已连通（${sampleTool} 需要业务参数，当前使用空参数诊断）: ${data.error.message}`,
          });
          return { steps };
        }
        steps.push({
          step: 'tools_call',
          ok: false,
          detail: data.error.message,
        });
        return { steps };
      }
      steps.push({
        step: 'tools_call',
        ok: true,
        detail: `ok (${sampleTool})`,
      });
    } catch (error) {
      steps.push({
        step: 'tools_call',
        ok: false,
        detail: error instanceof Error ? error.message : 'unknown error',
      });
    }
    return { steps };
  }

  private isLikelyArgumentError(message: string): boolean {
    const lower = message.toLowerCase();
    return (
      lower.includes('not found') ||
      lower.includes('required') ||
      lower.includes('missing') ||
      lower.includes('invalid') ||
      lower.includes('validation') ||
      lower.includes('bad request')
    );
  }

  private buildRemoteHeaders(
    server: MCPServer,
    config: RemoteMcpConfig,
    userId?: number,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(config.headers || {}),
    };
    if (config.bearerToken) {
      headers.Authorization = `Bearer ${config.bearerToken}`;
      return headers;
    }
    if (this.shouldUseInternalUserToken(server, config.url) && userId) {
      const token = this.jwtService.sign({ sub: userId, typ: 'access' });
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private shouldUseInternalUserToken(server: MCPServer, url?: string): boolean {
    const trimmed = url?.trim() || '';
    if (!trimmed) return false;
    if (server.marketplaceId !== 'github') return false;
    return trimmed.includes('/api/mcp/github');
  }

  private toResponseDto(entity: MCPServer): MCPServerResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      icon: entity.icon || '',
      type: entity.type,
      marketplaceId: entity.marketplaceId || '',
      status: entity.status,
      lastError: entity.lastError || undefined,
      allowedTools: entity.allowedTools || [],
      config: entity.config || undefined,
      createdAt: entity.createdAt,
    };
  }
}
