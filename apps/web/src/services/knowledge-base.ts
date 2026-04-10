import { httpService } from './http';

export interface KnowledgeBaseResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  chunkCount: number;
  createdAt: string;
  indexedAt?: string;
}

export interface KnowledgeChunkResponse {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: string;
  score: number;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
}

export interface CreateKnowledgeBaseDto {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeBaseDto {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface SearchKnowledgeBaseDto {
  query: string;
  knowledgeBaseIds?: string[];
  topK?: number;
}

class KnowledgeBaseService {
  private baseUrl = '/api/knowledge-base';

  async getAll(): Promise<KnowledgeBaseResponse[]> {
    const response = await httpService.get<KnowledgeBaseResponse[]>(this.baseUrl);
    return response.data;
  }

  async getOne(id: string): Promise<KnowledgeBaseResponse> {
    const response = await httpService.get<KnowledgeBaseResponse>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBaseResponse> {
    const response = await httpService.post<KnowledgeBaseResponse>(this.baseUrl, dto);
    return response.data;
  }

  async update(id: string, dto: UpdateKnowledgeBaseDto): Promise<KnowledgeBaseResponse> {
    const response = await httpService.put<KnowledgeBaseResponse>(`${this.baseUrl}/${id}`, dto);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await httpService.delete(`${this.baseUrl}/${id}`);
  }

  async uploadDocument(kbId: string, file: File): Promise<KnowledgeChunkResponse[]> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await httpService.post<KnowledgeChunkResponse[]>(
      `${this.baseUrl}/${kbId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async getChunks(kbId: string): Promise<KnowledgeChunkResponse[]> {
    const response = await httpService.get<KnowledgeChunkResponse[]>(
      `${this.baseUrl}/${kbId}/chunks`
    );
    return response.data;
  }

  async deleteChunk(chunkId: string): Promise<void> {
    await httpService.delete(`${this.baseUrl}/chunks/${chunkId}`);
  }

  async search(dto: SearchKnowledgeBaseDto): Promise<SearchResult[]> {
    const response = await httpService.post<SearchResult[]>(`${this.baseUrl}/search`, dto);
    return response.data;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
