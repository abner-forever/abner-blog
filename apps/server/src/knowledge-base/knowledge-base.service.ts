import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import pdfParse from 'pdf-parse';
import {
  KnowledgeBase,
  KnowledgeBaseStatus,
} from '../entities/knowledge-base.entity';
import { KnowledgeChunk } from '../entities/knowledge-chunk.entity';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  SearchKnowledgeBaseDto,
  KnowledgeBaseResponseDto,
  KnowledgeChunkResponseDto,
  SearchResultDto,
} from './dto/knowledge-base.dto';
import * as crypto from 'crypto';
import * as fs from 'fs';
import fetch from 'node-fetch';

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

const EMBEDDING_MODEL = 'embo-01';
const EMBEDDING_DIMENSIONS = 1536;
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

interface ChromaMetadata {
  kbId?: string;
  kbName?: string;
  chunkIndex?: number;
  fileName?: string;
  [key: string]: unknown;
}

interface ChromaSearchResult {
  ids: string[][];
  distances: number[][];
  documents: string[][];
  metadatas: ChromaMetadata[][];
}

@Injectable()
export class KnowledgeBaseService {
  // ChromaDB v2 API paths
  private readonly chromaTenant = 'default';
  private readonly chromaDatabase = 'default';
  private readonly chromaCollectionName = 'knowledge_chunks';

  // Cache the collection ID after creation
  private chromaCollectionId: string | null = null;

  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly kbRepository: Repository<KnowledgeBase>,
    @InjectRepository(KnowledgeChunk)
    private readonly chunkRepository: Repository<KnowledgeChunk>,
  ) {}

  async create(
    dto: CreateKnowledgeBaseDto,
    userId: number,
  ): Promise<KnowledgeBaseResponseDto> {
    const kb = this.kbRepository.create({
      name: dto.name,
      description: dto.description,
      userId,
      status: KnowledgeBaseStatus.ACTIVE,
      chunkCount: 0,
    });
    const saved = await this.kbRepository.save(kb);
    return this.toResponseDto(saved);
  }

  async findAll(userId: number): Promise<KnowledgeBaseResponseDto[]> {
    const kbs = await this.kbRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return kbs.map((kb) => this.toResponseDto(kb));
  }

  async findOne(id: string, userId: number): Promise<KnowledgeBaseResponseDto> {
    const kb = await this.kbRepository.findOne({
      where: { id, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    return this.toResponseDto(kb);
  }

  async update(
    id: string,
    dto: UpdateKnowledgeBaseDto,
    userId: number,
  ): Promise<KnowledgeBaseResponseDto> {
    const kb = await this.kbRepository.findOne({
      where: { id, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    if (dto.name !== undefined) kb.name = dto.name;
    if (dto.description !== undefined) kb.description = dto.description;
    if (dto.status !== undefined) kb.status = dto.status as KnowledgeBaseStatus;
    const saved = await this.kbRepository.save(kb);
    return this.toResponseDto(saved);
  }

  async remove(id: string, userId: number): Promise<void> {
    const kb = await this.kbRepository.findOne({
      where: { id, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    // Delete from ChromaDB
    try {
      await this.deleteFromChroma(id);
    } catch (e) {
      console.error('Failed to delete from ChromaDB:', e);
    }
    // Delete chunks from database
    await this.chunkRepository.delete({ knowledgeBaseId: id });
    await this.kbRepository.remove(kb);
  }

  async addDocument(
    kbId: string,
    file: Express.Multer.File,
    userId: number,
  ): Promise<KnowledgeChunkResponseDto[]> {
    const kb = await this.kbRepository.findOne({
      where: { id: kbId, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }

    // Parse document content
    const content = await this.parseDocument(file);
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('无法解析文档内容');
    }

    // Chunk the content
    const chunks = this.chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);

    // Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks);

    // Save chunks to database
    const chunkEntities: KnowledgeChunk[] = [];
    const fixedFileName = this.fixFilenameEncoding(file.originalname);
    for (let i = 0; i < chunks.length; i++) {
      const contentHash = crypto
        .createHash('md5')
        .update(chunks[i])
        .digest('hex');
      // If multiple chunks, add sequence number to filename
      const displayFileName =
        chunks.length > 1
          ? `${fixedFileName} (${i + 1}/${chunks.length})`
          : fixedFileName;
      const chunk = this.chunkRepository.create({
        knowledgeBaseId: kbId,
        content: chunks[i],
        contentHash,
        chunkIndex: i,
        metadata: JSON.stringify({
          fileName: displayFileName,
          originalFileName: fixedFileName,
          mimeType: file.mimetype,
          size: file.size,
          totalChunks: chunks.length,
        }),
      });
      chunkEntities.push(await this.chunkRepository.save(chunk));
    }

    // Store in ChromaDB
    try {
      await this.addToChroma(kbId, kb.name, chunks, embeddings);
      kb.indexedAt = new Date();
    } catch (e) {
      console.error('Failed to add to ChromaDB:', e);
    }

    // Update chunk count (accumulate)
    kb.chunkCount = (kb.chunkCount || 0) + chunkEntities.length;
    await this.kbRepository.save(kb);

    return chunkEntities.map((c) => this.toChunkResponseDto(c));
  }

  async getChunks(
    kbId: string,
    userId: number,
  ): Promise<KnowledgeChunkResponseDto[]> {
    const kb = await this.kbRepository.findOne({
      where: { id: kbId, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    const chunks = await this.chunkRepository.find({
      where: { knowledgeBaseId: kbId },
      order: { chunkIndex: 'ASC' },
    });
    return chunks.map((c) => this.toChunkResponseDto(c));
  }

  async deleteChunk(chunkId: string, userId: number): Promise<void> {
    const chunk = await this.chunkRepository.findOne({
      where: { id: chunkId },
    });
    if (!chunk) {
      throw new NotFoundException('Chunk不存在');
    }
    const kb = await this.kbRepository.findOne({
      where: { id: chunk.knowledgeBaseId, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    await this.chunkRepository.remove(chunk);
    // Update count
    kb.chunkCount = await this.chunkRepository.count({
      where: { knowledgeBaseId: kb.id },
    });
    await this.kbRepository.save(kb);
  }

  async search(
    dto: SearchKnowledgeBaseDto,
    userId: number,
  ): Promise<SearchResultDto[]> {
    const { query, knowledgeBaseIds, topK = 5 } = dto;

    // Get user's knowledge bases
    const userKbs = await this.kbRepository.find({
      where: { userId, status: KnowledgeBaseStatus.ACTIVE },
    });
    const userKbIds = userKbs.map((kb) => kb.id);

    // Filter by specified knowledge bases if provided
    const searchKbIds = knowledgeBaseIds
      ? knowledgeBaseIds.filter((id) => userKbIds.includes(id))
      : userKbIds;

    if (searchKbIds.length === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await this.generateSingleEmbedding(query);

    // Search ChromaDB
    try {
      const results = await this.searchChroma(
        queryEmbedding,
        searchKbIds,
        topK,
      );
      return this.formatSearchResults(results, userKbs);
    } catch (e) {
      console.error('ChromaDB search failed:', e);
      // Fallback to database search
      return this.fallbackSearch(query, searchKbIds, userKbs, topK);
    }
  }

  private async parseDocument(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype;

    // If buffer is not available (disk storage), read from path
    const fileBuffer = file.buffer || (await fs.promises.readFile(file.path));

    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return fileBuffer.toString('utf-8');
    }

    if (mimeType.includes('pdf')) {
      try {
        const data = (await pdfParse(fileBuffer)) as { text: string };
        return data.text;
      } catch (e) {
        console.error('PDF parse error:', e);
        return '';
      }
    }

    if (mimeType.includes('document') || mimeType.includes('word')) {
      // Basic DOCX extraction - reads text from XML content
      return fileBuffer
        .toString('utf-8')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    return fileBuffer.toString('utf-8');
  }

  /**
   * Fix filename encoding issues - when UTF-8 filenames are incorrectly decoded as Latin-1
   */
  private fixFilenameEncoding(filename: string): string {
    // Check if filename contains garbled characters (Latin-1 interpreted UTF-8)
    if (/[æ°ä¸å¨æ¤åè®¡¥]/g.test(filename)) {
      try {
        // Re-encode as Latin-1 to get original UTF-8 bytes, then decode as UTF-8
        const buffer = Buffer.from(filename, 'latin1');
        const fixed = buffer.toString('utf-8');
        // Validate that we got valid Chinese characters
        if (/[\u4e00-\u9fa5]/.test(fixed)) {
          return fixed;
        }
      } catch {
        // Ignore encoding errors
      }
    }
    return filename;
  }

  private chunkText(
    text: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.MINIMAX_API_KEY || '';
    if (!apiKey) {
      throw new BadRequestException('MiniMax API key not configured');
    }

    const baseUrl =
      process.env.MINIMAX_API_BASE?.trim() || 'https://api.minimax.io';
    const url = `${baseUrl.replace(/\/$/, '')}/v1/embeddings`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        texts: texts,
        type: 'db',
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new BadRequestException(`Embedding API error: ${raw}`);
    }

    const data = JSON.parse(raw) as Record<string, unknown>;

    // Check MiniMax API error response first
    const baseResp = data.base_resp as
      | { status_code: number; status_msg: string }
      | undefined;
    if (baseResp?.status_code !== 0) {
      throw new BadRequestException(
        `Embedding API error: ${baseResp?.status_msg ?? raw}`,
      );
    }

    // MiniMax embedding API returns { vectors: [[...]] }
    const vectorsField = data.vectors;
    if (Array.isArray(vectorsField)) {
      return vectorsField as number[][];
    }

    // Fallback: OpenAI-compatible format { data: [{ embedding: [...], index: 0 }] }
    const dataField = data.data;
    if (Array.isArray(dataField)) {
      return dataField.map(
        (item): number[] => (item as { embedding: number[] }).embedding,
      );
    }

    // Fallback: maybe it's { embeddings: [[...]] }
    const embeddingsField = data.embeddings;
    if (Array.isArray(embeddingsField)) {
      return embeddingsField as number[][];
    }

    // Fallback: maybe it's { data: { embedding: [...] } } (single)
    const singleData = data.data as { embedding?: number[] } | undefined;
    if (singleData?.embedding) {
      return [singleData.embedding];
    }

    // If vectors is null but API returned success, return empty (chunks saved without embeddings)
    if (vectorsField === null) {
      console.warn(
        'Embedding API returned null vectors, storing chunks without vector index',
      );
      return [];
    }

    throw new BadRequestException(`Unknown embedding response format: ${raw}`);
  }

  private async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  private getCollectionUrl(path: string): string {
    return `${CHROMA_URL}/api/v2/tenants/${this.chromaTenant}/databases/${this.chromaDatabase}/collections${path}`;
  }

  private async ensureDatabase(): Promise<void> {
    const response = await fetch(
      `${CHROMA_URL}/api/v2/tenants/${this.chromaTenant}/databases`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.chromaDatabase }),
      },
    );
    // 409 means already exists, which is fine
    if (!response.ok && response.status !== 409) {
      console.warn(`Failed to create database: ${response.statusText}`);
    }
  }

  private async ensureCollection(): Promise<string> {
    if (this.chromaCollectionId) {
      return this.chromaCollectionId;
    }

    // Ensure database exists first
    await this.ensureDatabase();

    // Try to get existing collection
    const getResponse = await fetch(
      this.getCollectionUrl(`/${this.chromaCollectionName}`),
      { method: 'GET' },
    );

    if (getResponse.ok) {
      const data = (await getResponse.json()) as { id: string };
      this.chromaCollectionId = data.id;
      return this.chromaCollectionId;
    }

    // Create new collection
    const createResponse = await fetch(this.getCollectionUrl(''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.chromaCollectionName,
        get_or_create: true,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create ChromaDB collection: ${createResponse.statusText}`,
      );
    }

    const created = (await createResponse.json()) as { id: string };
    this.chromaCollectionId = created.id;
    return this.chromaCollectionId;
  }

  private async addToChroma(
    kbId: string,
    kbName: string,
    chunks: string[],
    embeddings: number[][],
  ): Promise<void> {
    const collectionId = await this.ensureCollection();

    const ids = chunks.map((_, i) => `${kbId}_chunk_${i}_${Date.now()}`);

    await fetch(this.getCollectionUrl(`/${collectionId}/add`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids,
        embeddings: embeddings.map((e) => e.slice(0, EMBEDDING_DIMENSIONS)),
        documents: chunks,
        metadatas: chunks.map((_, i) => ({
          kbId,
          kbName,
          chunkIndex: i,
        })),
      }),
    });
  }

  private async deleteFromChroma(kbId: string): Promise<void> {
    if (!this.chromaCollectionId) {
      return;
    }
    try {
      await fetch(this.getCollectionUrl(`/${this.chromaCollectionId}/delete`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: { kbId },
        }),
      });
    } catch (e) {
      console.error('Failed to delete from ChromaDB:', e);
    }
  }

  private async searchChroma(
    queryEmbedding: number[],
    kbIds: string[],
    topK: number,
  ): Promise<ChromaSearchResult> {
    const collectionId = await this.ensureCollection();

    const response = await fetch(
      this.getCollectionUrl(`/${collectionId}/query`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_embeddings: [queryEmbedding.slice(0, EMBEDDING_DIMENSIONS)],
          n_results: topK,
          where: { kbId: { $in: kbIds } },
          include: ['documents', 'metadatas', 'distances'],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`ChromaDB query failed: ${response.statusText}`);
    }

    return (await response.json()) as ChromaSearchResult;
  }

  private async fallbackSearch(
    query: string,
    kbIds: string[],
    userKbs: KnowledgeBase[],
    topK: number,
  ): Promise<SearchResultDto[]> {
    // Simple keyword-based fallback search
    const chunks = await this.chunkRepository
      .createQueryBuilder('chunk')
      .where('chunk.knowledgeBaseId IN (:...kbIds)', { kbIds })
      .orderBy('chunk.createdAt', 'DESC')
      .take(topK * 2)
      .getMany();

    const queryWords = query.toLowerCase().split(/\s+/);
    const scored = chunks.map((chunk) => {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word)) {
          score += 1;
        }
      }
      return { chunk, score };
    });

    const kbMap = new Map(userKbs.map((kb) => [kb.id, kb]));

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({
        id: s.chunk.id,
        content: s.chunk.content,
        metadata: s.chunk.metadata,
        score: s.score,
        knowledgeBaseId: s.chunk.knowledgeBaseId,
        knowledgeBaseName: kbMap.get(s.chunk.knowledgeBaseId)?.name || '',
      }));
  }

  private formatSearchResults(
    results: ChromaSearchResult,
    userKbs: KnowledgeBase[],
  ): SearchResultDto[] {
    const kbMap = new Map(userKbs.map((kb) => [kb.id, kb]));

    if (!results.ids || results.ids.length === 0) {
      return [];
    }

    return results.ids[0].map((id, i) => {
      const metadata = results.metadatas?.[0]?.[i] || {};
      return {
        id,
        content: results.documents?.[0]?.[i] || '',
        metadata: JSON.stringify(metadata),
        score: 1 - (results.distances?.[0]?.[i] || 0), // Convert distance to similarity
        knowledgeBaseId: metadata.kbId || '',
        knowledgeBaseName: kbMap.get(metadata.kbId)?.name || '',
      };
    });
  }

  private toResponseDto(entity: KnowledgeBase): KnowledgeBaseResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      status: entity.status,
      chunkCount: entity.chunkCount,
      createdAt: entity.createdAt,
      indexedAt: entity.indexedAt || undefined,
    };
  }

  private toChunkResponseDto(
    entity: KnowledgeChunk,
  ): KnowledgeChunkResponseDto {
    return {
      id: entity.id,
      content: entity.content,
      chunkIndex: entity.chunkIndex,
      metadata: entity.metadata || '{}',
      createdAt: entity.createdAt,
    };
  }
}
