import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Parameters<McpServer['registerTool']>[1]['inputSchema'];
}

export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: ToolDefinition['inputSchema'];
}

export type ToolCallParams = Parameters<
  Parameters<McpServer['registerTool']>[2]
>[0];

export type McpToolCallback = Parameters<McpServer['registerTool']>[2];

export type McpToolResult = Awaited<ReturnType<McpToolCallback>>;
