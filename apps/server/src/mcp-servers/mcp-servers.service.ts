import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

// Predefined marketplace MCP servers
const MARKETPLACE_MCP_SERVERS = [
  {
    id: 'github',
    name: 'GitHub',
    description:
      'GitHub API integration for repository management, issues, and pull requests',
    icon: 'github',
    tools: ['get_repo', 'create_issue', 'list_issues', 'list_prs', 'create_pr'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Slack messaging integration for sending messages and managing channels',
    icon: 'slack',
    tools: ['send_message', 'list_channels', 'get_channel_info'],
  },
  {
    id: 'filesystem',
    name: 'File System',
    description: 'Local file system operations - read, write, list directories',
    icon: 'folder',
    tools: ['read_file', 'write_file', 'list_directory', 'create_directory'],
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information using search engines',
    icon: 'search',
    tools: ['search', 'get_page_content'],
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Execute SQL queries on connected databases',
    icon: 'database',
    tools: ['execute_query', 'list_tables', 'describe_table'],
  },
];

@Injectable()
export class MCPServersService {
  constructor(
    @InjectRepository(MCPServer)
    private readonly mcpServerRepository: Repository<MCPServer>,
  ) {}

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
    // Check if already installed
    const existing = await this.mcpServerRepository.findOne({
      where: { userId, marketplaceId: dto.marketplaceId },
    });
    if (existing) {
      // Update existing instead
      existing.name = dto.name || existing.name;
      existing.config = dto.config || existing.config;
      existing.allowedTools = dto.allowedTools || existing.allowedTools;
      existing.status = MCPServerStatus.ACTIVE;
      const saved = await this.mcpServerRepository.save(existing);
      return this.toResponseDto(saved);
    }

    // Find marketplace definition
    const marketplaceDef = MARKETPLACE_MCP_SERVERS.find(
      (m) => m.id === dto.marketplaceId,
    );

    const server = this.mcpServerRepository.create({
      userId,
      name: dto.name || marketplaceDef?.name || dto.marketplaceId,
      description: marketplaceDef?.description || '',
      icon: marketplaceDef?.icon || '',
      type: MCPServerType.MARKETPLACE,
      marketplaceId: dto.marketplaceId,
      config: dto.config || {},
      allowedTools: dto.allowedTools || marketplaceDef?.tools || [],
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

  async getMarketplace(userId: number): Promise<MarketplaceMCPServerDto[]> {
    // Get user's installed servers
    const installed = await this.mcpServerRepository.find({
      where: { userId },
      select: ['marketplaceId'],
    });
    const installedIds = new Set(installed.map((s) => s.marketplaceId));

    return MARKETPLACE_MCP_SERVERS.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      icon: m.icon,
      tools: m.tools,
      isInstalled: installedIds.has(m.id),
    }));
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
      createdAt: entity.createdAt,
    };
  }
}
