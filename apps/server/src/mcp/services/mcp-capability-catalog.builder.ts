import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpService } from './mcp.service';
import { MCP_CAPABILITY_CATALOG } from '../catalog/mcp-capability-catalog.definitions';
import type { MCPServerCatalogItem } from '../catalog/mcp-capability-catalog.types';

function normalizeApiBase(raw: string): string {
  return raw.replace(/\/$/, '');
}

/**
 * 解析供服务端自身请求 MCP 时使用的 API 根地址（含 /api 前缀若已配置）。
 * 优先 PUBLIC_API_BASE_URL，否则用 PORT 拼本地地址。
 */
@Injectable()
export class McpCapabilityCatalogBuilder {
  constructor(
    private readonly mcpService: McpService,
    private readonly configService: ConfigService,
  ) {}

  private resolvePublicApiBase(): string {
    const fromEnv = this.configService
      .get<string>('PUBLIC_API_BASE_URL')
      ?.trim();
    if (fromEnv) {
      return normalizeApiBase(fromEnv);
    }
    const port = this.configService.get<string>('PORT') || '8080';
    return normalizeApiBase(`http://127.0.0.1:${port}`);
  }

  buildCatalog(): MCPServerCatalogItem[] {
    const base = this.resolvePublicApiBase();
    const tools = this.mcpService.listTools().map((t) => t.name);
    const items: MCPServerCatalogItem[] = [];

    for (const def of MCP_CAPABILITY_CATALOG) {
      if (def.kind === 'builtin') {
        const grouped = tools.filter((name) => def.matchTool(name));
        if (grouped.length === 0) continue;
        items.push({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          tools: grouped,
          source: 'builtin',
        });
        continue;
      }

      const defaultConfig: Record<string, unknown> = {
        ...(def.defaultConfig ? { ...def.defaultConfig } : {}),
      };
      if (def.useInternalGithubEndpoint) {
        defaultConfig.url = `${base}/api/mcp/github`;
      }
      if (def.useInternalWebSearchEndpoint) {
        defaultConfig.url = `${base}/api/mcp/web-search`;
      }

      items.push({
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        tools: def.tools,
        source: 'marketplace',
        defaultConfig:
          Object.keys(defaultConfig).length > 0 ? defaultConfig : undefined,
      });
    }

    return items;
  }

  findCatalogItem(id: string): MCPServerCatalogItem | undefined {
    return this.buildCatalog().find((m) => m.id === id);
  }
}
