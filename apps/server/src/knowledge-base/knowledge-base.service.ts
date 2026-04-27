import {
  Injectable,
  Logger,
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
import { AIConfigService } from '../ai/services/ai-config.service';
import { callMinimaxEmbeddings } from '../ai/utils/minimax-embeddings';
import * as crypto from 'crypto';
import * as fs from 'fs';
import fetch from 'node-fetch';

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';

/** 嵌入模型：历史说明见 https://platform.minimaxi.com/docs/faq/history-query 中 Embeddings 条目 */
const EMBEDDING_DIMENSIONS = 1536;
// Use char-based chunking to support CJK documents without spaces.
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 120;
const EMBEDDING_MAX_CHARS_PER_CHUNK = 1200;
const CHUNK_MIN_FILL_RATIO = 0.65;
type EmbeddingType = 'db' | 'query';

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

interface DocumentProcessingStatus {
  processing: boolean;
  stage:
    | 'idle'
    | 'parsing'
    | 'chunking'
    | 'embedding'
    | 'saving'
    | 'indexing'
    | 'done'
    | 'failed';
  progress: number;
  message: string;
  totalChunks?: number;
  completedChunks?: number;
  etaSeconds?: number;
  taskId?: string;
  updatedAt: number;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly processingStatus = new Map<
    string,
    DocumentProcessingStatus
  >();

  // ChromaDB v2 API paths
  private readonly chromaTenant = 'default';
  private readonly chromaDatabase = 'default';
  private readonly chromaCollectionPrefix = 'knowledge_chunks';

  // Cache the collection ID after creation
  private chromaCollectionId: string | null = null;
  private getChromaCollectionName(): string {
    const model = (process.env.EMBEDDING_MODEL || 'default').toLowerCase();
    const suffix = model.replace(/[^a-z0-9_-]/g, '_');
    return `${this.chromaCollectionPrefix}_${suffix}`;
  }

  constructor(
    @InjectRepository(KnowledgeBase)
    private readonly kbRepository: Repository<KnowledgeBase>,
    @InjectRepository(KnowledgeChunk)
    private readonly chunkRepository: Repository<KnowledgeChunk>,
    private readonly aiConfigService: AIConfigService,
  ) {}

  private getProcessingStatusKey(kbId: string, userId: number): string {
    return `${userId}:${kbId}`;
  }

  private setProcessingStatus(
    kbId: string,
    userId: number,
    status: Omit<DocumentProcessingStatus, 'updatedAt'>,
  ): void {
    this.processingStatus.set(this.getProcessingStatusKey(kbId, userId), {
      ...status,
      updatedAt: Date.now(),
    });
  }

  private clearProcessingStatus(kbId: string, userId: number): void {
    const key = this.getProcessingStatusKey(kbId, userId);
    setTimeout(() => {
      this.processingStatus.delete(key);
    }, 120000);
  }

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

  async getDocumentProcessingStatus(
    id: string,
    userId: number,
  ): Promise<{
    processing: boolean;
    stage: string;
    progress: number;
    message: string;
    totalChunks?: number;
    completedChunks?: number;
    etaSeconds?: number;
    taskId?: string;
  }> {
    const kb = await this.kbRepository.findOne({
      where: { id, userId },
      select: ['id'],
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }

    const status = this.processingStatus.get(
      this.getProcessingStatusKey(id, userId),
    );
    if (!status) {
      return {
        processing: false,
        stage: 'idle',
        progress: 0,
        message: '空闲',
      };
    }

    return {
      processing: status.processing,
      stage: status.stage,
      progress: status.progress,
      message: status.message,
      totalChunks: status.totalChunks,
      completedChunks: status.completedChunks,
      etaSeconds: status.etaSeconds,
      taskId: status.taskId,
    };
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
  ): Promise<{ accepted: boolean; taskId: string }> {
    const kb = await this.kbRepository.findOne({
      where: { id: kbId, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }

    const statusKey = this.getProcessingStatusKey(kbId, userId);
    const existingStatus = this.processingStatus.get(statusKey);
    if (existingStatus?.processing) {
      throw new BadRequestException('该知识库已有文档正在处理中，请稍后重试');
    }
    const taskId = crypto.randomUUID();

    this.setProcessingStatus(kbId, userId, {
      processing: true,
      taskId,
      stage: 'parsing',
      progress: 1,
      message: '已接收文档，准备处理',
    });
    setImmediate(() => {
      void this.processDocumentUpload(kb, kbId, file, userId, taskId);
    });
    return { accepted: true, taskId };
  }

  private async processDocumentUpload(
    kb: KnowledgeBase,
    kbId: string,
    file: Express.Multer.File,
    userId: number,
    taskId: string,
  ): Promise<void> {
    this.setProcessingStatus(kbId, userId, {
      processing: true,
      taskId,
      stage: 'parsing',
      progress: 2,
      message: '正在解析文档内容',
    });

    try {
      // Parse document content
      const content = await this.parseDocument(file);
      if (!content || content.trim().length === 0) {
        throw new BadRequestException('无法解析文档内容');
      }

      this.setProcessingStatus(kbId, userId, {
        processing: true,
        taskId,
        stage: 'chunking',
        progress: 8,
        message: '正在切分文本块',
      });

      // Chunk the content
      const chunks = this.chunkText(content, CHUNK_SIZE, CHUNK_OVERLAP);

      this.setProcessingStatus(kbId, userId, {
        processing: true,
        taskId,
        stage: 'embedding',
        progress: 12,
        message: `正在生成向量 0/${chunks.length || 0}`,
        totalChunks: chunks.length,
        completedChunks: 0,
      });

      let embeddings: number[][] = [];
      try {
        embeddings = await this.generateEmbeddings(
          chunks,
          userId,
          'db',
          (done, total, avgBatchMs, etaSeconds) => {
            const embeddingProgress =
              total <= 0 ? 0 : Math.round((done / total) * 58);
            const etaMsg = etaSeconds > 0 ? `，预计剩余 ${etaSeconds}s` : '';
            this.setProcessingStatus(kbId, userId, {
              processing: true,
              taskId,
              stage: 'embedding',
              progress: Math.min(70, 12 + embeddingProgress),
              message: `正在生成向量 ${done}/${total}${etaMsg}`,
              totalChunks: total,
              completedChunks: done,
              etaSeconds,
            });
            this.logger.log(
              `[KB embedding] kbId=${kbId} userId=${userId} progress=${done}/${total} avgBatchMs=${avgBatchMs} etaSeconds=${etaSeconds}`,
            );
          },
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(
          `[KB upload] userId=${userId} kbId=${kbId} embeddings_failed → 仅保存文本块（可走关键词检索），待余额恢复后重新上传或触发同步以建向量 msg=${msg}`,
        );
      }

      this.setProcessingStatus(kbId, userId, {
        processing: true,
        taskId,
        stage: 'saving',
        progress: 76,
        message: '正在保存文本块',
        totalChunks: chunks.length,
        completedChunks: chunks.length,
      });

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

      this.setProcessingStatus(kbId, userId, {
        processing: true,
        taskId,
        stage: 'indexing',
        progress: 90,
        message: '正在写入向量索引',
        totalChunks: chunks.length,
        completedChunks: chunks.length,
      });

      // Store in ChromaDB（需与 chunk 条数一致的向量；嵌入失败时跳过，避免整次上传失败）
      if (
        embeddings.length === chunkEntities.length &&
        chunkEntities.length > 0
      ) {
        try {
          await this.addToChroma(kbId, kb.name, chunkEntities, embeddings);
          kb.indexedAt = new Date();
        } catch (e) {
          this.logger.error(`Failed to add to ChromaDB: ${e}`);
        }
      } else if (chunkEntities.length > 0 && embeddings.length === 0) {
        this.logger.log(
          `[KB upload] userId=${userId} kbId=${kbId} chroma_skipped=no_embeddings`,
        );
      }

      // Update chunk count (accumulate)
      kb.chunkCount = (kb.chunkCount || 0) + chunkEntities.length;
      await this.kbRepository.save(kb);

      this.setProcessingStatus(kbId, userId, {
        processing: false,
        taskId,
        stage: 'done',
        progress: 100,
        message: '文档处理完成',
        totalChunks: chunks.length,
        completedChunks: chunks.length,
      });
      this.clearProcessingStatus(kbId, userId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.setProcessingStatus(kbId, userId, {
        processing: false,
        taskId,
        stage: 'failed',
        progress: 100,
        message: `处理失败：${msg}`,
      });
      this.clearProcessingStatus(kbId, userId);
      this.logger.error(
        `[KB upload] userId=${userId} kbId=${kbId} taskId=${taskId} failed msg=${msg}`,
      );
    }
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

  async deleteChunk(
    knowledgeBaseId: string,
    chunkId: string,
    userId: number,
  ): Promise<void> {
    const kb = await this.kbRepository.findOne({
      where: { id: knowledgeBaseId, userId },
    });
    if (!kb) {
      throw new NotFoundException('知识库不存在');
    }
    const chunk = await this.chunkRepository.findOne({
      where: { id: chunkId, knowledgeBaseId },
    });
    if (!chunk) {
      throw new NotFoundException(
        '文本块不存在或已删除，请关闭弹窗后重新打开「查看文本块」以刷新列表',
      );
    }
    await this.chunkRepository.remove(chunk);
    // Update count
    kb.chunkCount = await this.chunkRepository.count({
      where: { knowledgeBaseId: kb.id },
    });

    // Keep vector index in sync after deleting chunk.
    await this.syncKnowledgeBaseIndex(kb.id, kb.name, userId);
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
      this.logger.log(
        `[KB search] userId=${userId} skip=no_searchable_kb activeKb=${userKbs.length} filtered=${Boolean(knowledgeBaseIds)}`,
      );
      return [];
    }

    this.logger.log(
      `[KB search] userId=${userId} queryLen=${query.length} topK=${topK} kbCount=${searchKbIds.length} chroma=${CHROMA_URL}`,
    );

    // Generate query embedding
    const queryEmbedding = await this.generateSingleEmbedding(query, userId);
    this.logger.log(
      `[KB search] userId=${userId} embeddingDim=${queryEmbedding.length}`,
    );

    // Search ChromaDB
    try {
      const results = await this.searchChroma(
        queryEmbedding,
        searchKbIds,
        topK,
      );
      const rawHitCount = results.ids?.[0]?.length ?? 0;
      const formatted = this.formatSearchResults(results, userKbs);
      this.logger.log(
        `[KB search] userId=${userId} chroma_ok rawHits=${rawHitCount} formattedHits=${formatted.length}`,
      );
      return formatted;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `[KB search] userId=${userId} chroma_failed msg=${msg} → keyword_fallback`,
      );
      const fallback = await this.fallbackSearch(
        query,
        searchKbIds,
        userKbs,
        topK,
      );
      this.logger.log(
        `[KB search] userId=${userId} fallback_hits=${fallback.length}`,
      );
      return fallback;
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
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
      return [];
    }

    const paragraphs = normalized
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const chunks: string[] = [];
    const step = Math.max(1, chunkSize - overlap);
    const fillRatio = Math.min(
      0.95,
      Math.max(
        0.3,
        Number.parseFloat(process.env.KB_CHUNK_MIN_FILL_RATIO || '') ||
          CHUNK_MIN_FILL_RATIO,
      ),
    );
    const minTargetLen = Math.max(1, Math.floor(chunkSize * fillRatio));
    let carry = '';

    for (const paragraph of paragraphs) {
      const combinedWithCarry = carry
        ? `${carry}\n\n${paragraph}`.trim()
        : paragraph;

      // If the current carry + paragraph fits, keep accumulating.
      if (combinedWithCarry.length <= chunkSize) {
        carry = combinedWithCarry;
        continue;
      }

      // Flush carry first if it is already "full enough".
      if (carry.length >= minTargetLen) {
        chunks.push(carry);
        carry = '';
      }

      const current = carry ? `${carry}\n\n${paragraph}`.trim() : paragraph;

      // After flushing, it may now fit as a new carry.
      if (current.length <= chunkSize) {
        carry = current;
        continue;
      }

      if (paragraph.length <= chunkSize) {
        // Paragraph itself can fit but combined content cannot;
        // flush carry and start next accumulation from this paragraph.
        if (carry.length > 0) {
          chunks.push(carry);
          carry = '';
        }
        carry = paragraph;
        continue;
      }

      // Prefer sentence boundaries before hard slicing.
      const sentences = paragraph
        .split(/(?<=[。！？.!?；;])/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      let buffer = '';
      for (const sentence of sentences) {
        if (!sentence) {
          continue;
        }
        if (sentence.length > chunkSize) {
          if (buffer.length > 0) {
            chunks.push(buffer);
            buffer = '';
          }
          for (let i = 0; i < sentence.length; i += step) {
            const part = sentence.slice(i, i + chunkSize).trim();
            if (part.length > 0) {
              chunks.push(part);
            }
          }
          continue;
        }

        const candidate = buffer ? `${buffer} ${sentence}` : sentence;
        if (candidate.length <= chunkSize) {
          buffer = candidate;
        } else {
          if (buffer.length > 0) {
            chunks.push(buffer);
          }
          buffer = sentence;
        }
      }

      if (buffer.length > 0) {
        chunks.push(buffer);
      }
    }

    if (carry.length > 0) {
      chunks.push(carry);
    }

    if (chunks.length === 0) {
      return [];
    }

    // Final guard: ensure no chunk exceeds max length accepted by embedding model.
    return chunks.flatMap((chunk) =>
      this.splitOversizedChunk(chunk, EMBEDDING_MAX_CHARS_PER_CHUNK, overlap),
    );
  }

  private splitOversizedChunk(
    chunk: string,
    maxChars: number,
    overlap: number,
  ): string[] {
    const trimmed = chunk.trim();
    if (!trimmed) {
      return [];
    }
    if (trimmed.length <= maxChars) {
      return [trimmed];
    }

    const safeOverlap = Math.min(
      Math.max(0, overlap),
      Math.floor(maxChars / 2),
    );
    const step = Math.max(1, maxChars - safeOverlap);
    const parts: string[] = [];
    for (let i = 0; i < trimmed.length; i += step) {
      const part = trimmed.slice(i, i + maxChars).trim();
      if (part.length > 0) {
        parts.push(part);
      }
    }
    return parts;
  }

  private async generateEmbeddings(
    texts: string[],
    userId: number,
    embeddingType: EmbeddingType = 'db',
    onProgress?: (
      completed: number,
      total: number,
      avgBatchMs: number,
      etaSeconds: number,
    ) => void,
  ): Promise<number[][]> {
    const safeTexts = texts
      .map((text) => text.trim())
      .filter((text) => text.length > 0)
      .map((text) =>
        text.length > EMBEDDING_MAX_CHARS_PER_CHUNK
          ? text.slice(0, EMBEDDING_MAX_CHARS_PER_CHUNK)
          : text,
      );
    const truncatedCount = texts.reduce(
      (count, text) =>
        count + (text.length > EMBEDDING_MAX_CHARS_PER_CHUNK ? 1 : 0),
      0,
    );
    if (safeTexts.length === 0) {
      return [];
    }
    const maxChunkLen = Math.max(...safeTexts.map((t) => t.length));
    const minChunkLen = Math.min(...safeTexts.map((t) => t.length));
    this.logger.log(
      `[KB embedding] userId=${userId} type=${embeddingType} chunks=${safeTexts.length} minLen=${minChunkLen} maxLen=${maxChunkLen} truncated=${truncatedCount}`,
    );

    const apiKey =
      await this.aiConfigService.resolveMinimaxEmbeddingApiKey(userId);

    const baseUrl = process.env.EMBEDDING_MODEL_URL;
    if (!baseUrl) {
      throw new Error('EMBEDDING_MODEL_URL is not set');
    }

    const batchSize =
      embeddingType === 'query'
        ? 1
        : Math.min(
            64,
            Math.max(
              8,
              Number.parseInt(
                process.env.KB_EMBEDDING_BATCH_SIZE || '32',
                10,
              ) || 32,
            ),
          );

    const vectors: number[][] = [];
    const totalBatches = Math.ceil(safeTexts.length / batchSize);
    let elapsedBatchMs = 0;
    for (let i = 0; i < safeTexts.length; i += batchSize) {
      const batchStart = Date.now();
      const batchTexts = safeTexts.slice(i, i + batchSize);
      const batchVectors = await callMinimaxEmbeddings(
        apiKey,
        baseUrl,
        process.env.EMBEDDING_MODEL,
        batchTexts,
        embeddingType,
      );
      vectors.push(...batchVectors);
      const batchMs = Date.now() - batchStart;
      elapsedBatchMs += batchMs;
      const completed = Math.min(safeTexts.length, i + batchTexts.length);
      const currentBatch = Math.floor(i / batchSize) + 1;
      const avgBatchMs = Math.round(elapsedBatchMs / currentBatch);
      const remainingBatches = Math.max(0, totalBatches - currentBatch);
      const etaSeconds = Math.max(
        0,
        Math.round((avgBatchMs * remainingBatches) / 1000),
      );
      this.logger.log(
        `[KB embedding] userId=${userId} type=${embeddingType} batch=${currentBatch}/${totalBatches} batchSize=${batchTexts.length} batchMs=${batchMs} avgBatchMs=${avgBatchMs} etaSeconds=${etaSeconds}`,
      );
      onProgress?.(completed, safeTexts.length, avgBatchMs, etaSeconds);
    }

    if (vectors.length === 0 && safeTexts.some((t) => t.trim().length > 0)) {
      console.warn(
        'Embedding API returned null/empty vectors, storing chunks without vector index',
      );
    }
    return vectors;
  }

  private async generateSingleEmbedding(
    text: string,
    userId: number,
  ): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text], userId, 'query');
    if (!embeddings[0]) {
      throw new BadRequestException('Failed to generate embedding for query');
    }
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
    const collectionName = this.getChromaCollectionName();
    const getResponse = await fetch(
      this.getCollectionUrl(`/${collectionName}`),
      {
        method: 'GET',
      },
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
        name: collectionName,
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
    chunks: KnowledgeChunk[],
    embeddings: number[][],
  ): Promise<void> {
    const collectionId = await this.ensureCollection();

    const ids = chunks.map((chunk) => chunk.id);

    await fetch(this.getCollectionUrl(`/${collectionId}/add`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids,
        embeddings: embeddings.map((e) => e.slice(0, EMBEDDING_DIMENSIONS)),
        documents: chunks.map((chunk) => chunk.content),
        metadatas: chunks.map((chunk) => ({
          kbId,
          kbName,
          chunkId: chunk.id,
          chunkIndex: chunk.chunkIndex,
          contentHash: chunk.contentHash,
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

  private async syncKnowledgeBaseIndex(
    kbId: string,
    kbName: string,
    userId: number,
  ): Promise<void> {
    const chunks = await this.chunkRepository.find({
      where: { knowledgeBaseId: kbId },
      order: { chunkIndex: 'ASC' },
    });

    if (chunks.length === 0) {
      await this.deleteFromChroma(kbId);
      return;
    }

    let embeddings: number[][] = [];
    try {
      embeddings = await this.generateEmbeddings(
        chunks.map((chunk) => chunk.content),
        userId,
        'db',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `[KB sync] kbId=${kbId} userId=${userId} embedding_failed → 已清空该库向量索引，保留数据库文本块 msg=${msg}`,
      );
      await this.deleteFromChroma(kbId);
      return;
    }

    if (embeddings.length !== chunks.length) {
      this.logger.warn(
        `[KB sync] kbId=${kbId} embedding_count_mismatch expected=${chunks.length} got=${embeddings.length} → clearing chroma only`,
      );
      await this.deleteFromChroma(kbId);
      return;
    }

    await this.deleteFromChroma(kbId);
    await this.addToChroma(kbId, kbName, chunks, embeddings);
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

    const queryWords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);
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
        score: this.normalizeRatioScore(s.score, queryWords.length),
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
      const distance = results.distances?.[0]?.[i];
      return {
        id,
        content: results.documents?.[0]?.[i] || '',
        metadata: JSON.stringify(metadata),
        score: this.distanceToSimilarityScore(distance),
        knowledgeBaseId: metadata.kbId || '',
        knowledgeBaseName: kbMap.get(metadata.kbId)?.name || '',
      };
    });
  }

  private distanceToSimilarityScore(distance?: number): number {
    if (typeof distance !== 'number' || Number.isNaN(distance)) {
      return 0;
    }
    // Convert [0, +inf) distance to (0, 1] similarity for stable UI display.
    return 1 / (1 + Math.max(0, distance));
  }

  private normalizeRatioScore(matchCount: number, totalTerms: number): number {
    if (totalTerms <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, matchCount / totalTerms));
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
