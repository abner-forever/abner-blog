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
  createdAt: string;
}

export interface MarketplaceMCPServer {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  isInstalled: boolean;
}

export interface InstallMCPServerDto {
  marketplaceId: string;
  name?: string;
  config?: Record<string, any>;
  allowedTools?: string[];
}

export interface UpdateMCPServerDto {
  name?: string;
  config?: Record<string, any>;
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
    const response = await httpService.get<MCPServerResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async install(dto: InstallMCPServerDto): Promise<MCPServerResponse> {
    const response = await httpService.post<MCPServerResponse>(
      `${this.baseUrl}/install`,
      dto
    );
    return response.data;
  }

  async update(id: string, dto: UpdateMCPServerDto): Promise<MCPServerResponse> {
    const response = await httpService.put<MCPServerResponse>(
      `${this.baseUrl}/${id}`,
      dto
    );
    return response.data;
  }

  async uninstall(id: string): Promise<void> {
    await httpService.delete(`${this.baseUrl}/${id}`);
  }

  async getMarketplace(): Promise<MarketplaceMCPServer[]> {
    const response = await httpService.get<MarketplaceMCPServer[]>(
      `${this.baseUrl}/marketplace/list`
    );
    return response.data;
  }

  async getStatus(id: string): Promise<{ status: string; lastError?: string }> {
    const response = await httpService.get<{ status: string; lastError?: string }>(
      `${this.baseUrl}/${id}/status`
    );
    return response.data;
  }
}

export const mcpServersService = new MCPServersService();
