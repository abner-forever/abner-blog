import { httpService } from './http';

export interface MCPServerResponse {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  marketplaceId: string;
  status: string;
  lastError?: string;
  allowedTools: string[];
  config?: Record<string, unknown>;
  createdAt: string;
  /** 远端类 MCP 是否仍缺少可用的 URL */
  requiresConfig?: boolean;
}

export interface MarketplaceMCPServer {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  source: 'builtin' | 'marketplace';
  isInstalled: boolean;
  /** 安装前：目录项是否缺少远端 URL（安装后仍需在已安装列表中查看） */
  requiresConfig?: boolean;
}

export interface InstallMCPServerDto {
  marketplaceId: string;
  name?: string;
  config?: Record<string, unknown>;
  allowedTools?: string[];
}

export interface UpdateMCPServerDto {
  name?: string;
  config?: Record<string, unknown>;
  status?: 'active' | 'inactive' | 'error';
  allowedTools?: string[];
}

class MCPServersService {
  private baseUrl = '/api/mcp-servers';

  async getAll(): Promise<MCPServerResponse[]> {
    const response = await httpService.get<MCPServerResponse[]>(this.baseUrl);
    return response.data;
  }

  async getOne(id: string): Promise<MCPServerResponse> {
    const response = await httpService.get<MCPServerResponse>(
      `${this.baseUrl}/${id}`,
    );
    return response.data;
  }

  async install(dto: InstallMCPServerDto): Promise<MCPServerResponse> {
    const response = await httpService.post<MCPServerResponse>(
      `${this.baseUrl}/install`,
      dto,
    );
    return response.data;
  }

  async update(
    id: string,
    dto: UpdateMCPServerDto,
  ): Promise<MCPServerResponse> {
    const response = await httpService.put<MCPServerResponse>(
      `${this.baseUrl}/${id}`,
      dto,
    );
    return response.data;
  }

  async uninstall(id: string): Promise<void> {
    await httpService.delete(`${this.baseUrl}/${id}`);
  }

  async getCatalog(): Promise<MarketplaceMCPServer[]> {
    const response = await httpService.get<MarketplaceMCPServer[]>(
      `${this.baseUrl}/catalog`,
    );
    return response.data;
  }

  async getStatus(id: string): Promise<{ status: string; lastError?: string }> {
    const response = await httpService.get<{
      status: string;
      lastError?: string;
    }>(`${this.baseUrl}/${id}/status`);
    return response.data;
  }

  async testConnection(
    id: string,
    config?: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> {
    const response = await httpService.post<{
      success: boolean;
      message: string;
    }>(`${this.baseUrl}/${id}/test-connection`, { config });
    return response.data;
  }

  async syncTools(
    id: string,
  ): Promise<{ success: boolean; tools: string[]; message: string }> {
    const response = await httpService.post<{
      success: boolean;
      tools: string[];
      message: string;
    }>(`${this.baseUrl}/${id}/sync-tools`);
    return response.data;
  }

  async diagnoseConnection(
    id: string,
    config?: Record<string, unknown>,
  ): Promise<{
    success: boolean;
    message: string;
    steps: Array<{ step: string; ok: boolean; detail: string }>;
    sampleTool?: string;
  }> {
    const response = await httpService.post<{
      success: boolean;
      message: string;
      steps: Array<{ step: string; ok: boolean; detail: string }>;
      sampleTool?: string;
    }>(`${this.baseUrl}/${id}/diagnose`, { config });
    return response.data;
  }
}

export const mcpServersService = new MCPServersService();
