/** 与前端 MarketplaceMCPServer.source 一致 */
export type MCPCatalogSource = 'builtin' | 'marketplace';

export interface MCPServerCatalogItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  source: MCPCatalogSource;
  defaultConfig?: Record<string, unknown>;
}

export interface BuiltinCapabilityDef {
  kind: 'builtin';
  id: string;
  name: string;
  description: string;
  icon: string;
  matchTool: (toolName: string) => boolean;
}

export interface RemoteCapabilityDef {
  kind: 'remote';
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  /** 静态默认配置；GitHub 的 url 在运行时注入 */
  defaultConfig?: Record<string, unknown>;
  /** 为 true 时用服务端可访问的 baseUrl + /api/mcp/github 填充 config.url */
  useInternalGithubEndpoint?: boolean;
  /** 为 true 时用 baseUrl + /api/mcp/web-search 填充 config.url */
  useInternalWebSearchEndpoint?: boolean;
}

export type McpCapabilityCatalogDef = BuiltinCapabilityDef | RemoteCapabilityDef;
