import { httpService } from './http';

export interface SkillWorkflow {
  nodes: any[];
  edges: any[];
  startNodeId: string;
}

export interface SkillResponse {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  workflow: SkillWorkflow;
  avatar: string;
  tools: string[];
  isGlobal: boolean;
  status: string;
  createdAt: string;
}

export interface MarketplaceSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  isInstalled: boolean;
  isGlobal: boolean;
}

export interface CreateSkillDto {
  name: string;
  description?: string;
  icon?: string;
  workflow?: SkillWorkflow;
  tools?: string[];
  avatar?: string;
}

export interface UpdateSkillDto {
  name?: string;
  description?: string;
  icon?: string;
  workflow?: SkillWorkflow;
  tools?: string[];
  avatar?: string;
  status?: 'active' | 'inactive';
}

class SkillsService {
  private baseUrl = '/api/skills';

  async getAll(): Promise<SkillResponse[]> {
    const response = await httpService.get<SkillResponse[]>(this.baseUrl);
    return response.data;
  }

  async getOne(id: string): Promise<SkillResponse> {
    const response = await httpService.get<SkillResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(dto: CreateSkillDto): Promise<SkillResponse> {
    const response = await httpService.post<SkillResponse>(this.baseUrl, dto);
    return response.data;
  }

  async update(id: string, dto: UpdateSkillDto): Promise<SkillResponse> {
    const response = await httpService.put<SkillResponse>(`${this.baseUrl}/${id}`, dto);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await httpService.delete(`${this.baseUrl}/${id}`);
  }

  async install(marketplaceId: string): Promise<SkillResponse> {
    const response = await httpService.post<SkillResponse>(
      `${this.baseUrl}/install/${marketplaceId}`,
      {}
    );
    return response.data;
  }

  async activate(id: string): Promise<SkillResponse> {
    const response = await httpService.post<SkillResponse>(
      `${this.baseUrl}/${id}/activate`,
      {}
    );
    return response.data;
  }

  async deactivate(id: string): Promise<SkillResponse> {
    const response = await httpService.post<SkillResponse>(
      `${this.baseUrl}/${id}/deactivate`,
      {}
    );
    return response.data;
  }

  async getMarketplace(): Promise<MarketplaceSkill[]> {
    const response = await httpService.get<MarketplaceSkill[]>(
      `${this.baseUrl}/marketplace/list`
    );
    return response.data;
  }
}

export const skillsService = new SkillsService();
