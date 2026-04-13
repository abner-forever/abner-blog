import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Skill, SkillStatus } from '../entities/skill.entity';
import { AIConfigService } from '../ai/services/ai-config.service';
import { callMinimaxEmbeddings } from '../ai/utils/minimax-embeddings';

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const EMBEDDING_MODEL = 'embo-01';
const EMBEDDING_DIMENSIONS = 1536;

type EmbeddingType = 'db' | 'query';

interface ChromaQueryResponse {
  ids?: string[][];
  metadatas?: Record<string, unknown>[][];
  distances?: number[][];
}

/**
 * 技能向量索引：与知识库共用 Chroma + MiniMax embedding，独立 collection。
 * 用于在「已激活技能较多」时按用户当前消息检索最相关的若干条，再注入系统提示。
 */
@Injectable()
export class SkillVectorService {
  private readonly logger = new Logger(SkillVectorService.name);

  constructor(private readonly aiConfigService: AIConfigService) {}
  private readonly chromaTenant = 'default';
  private readonly chromaDatabase = 'default';
  private readonly collectionName = 'skill_vectors';
  private chromaCollectionId: string | null = null;

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
    if (!response.ok && response.status !== 409) {
      this.logger.warn(`Chroma ensure database: ${response.statusText}`);
    }
  }

  private async ensureCollection(): Promise<string> {
    if (this.chromaCollectionId) {
      return this.chromaCollectionId;
    }
    await this.ensureDatabase();
    const getResponse = await fetch(
      this.getCollectionUrl(`/${this.collectionName}`),
      { method: 'GET' },
    );
    if (getResponse.ok) {
      const data = (await getResponse.json()) as { id: string };
      this.chromaCollectionId = data.id;
      return this.chromaCollectionId;
    }
    const createResponse = await fetch(this.getCollectionUrl(''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.collectionName,
        get_or_create: true,
      }),
    });
    if (!createResponse.ok) {
      throw new Error(
        `Failed to create skill Chroma collection: ${createResponse.statusText}`,
      );
    }
    const created = (await createResponse.json()) as { id: string };
    this.chromaCollectionId = created.id;
    return this.chromaCollectionId;
  }

  buildSkillEmbeddingText(skill: Skill): string {
    const wf = skill.workflow;
    const nodeLines: string[] = [];
    if (wf?.nodes?.length) {
      for (const n of wf.nodes) {
        if (n.type === 'prompt' && n.prompt) {
          nodeLines.push(`${n.id}: ${n.prompt}`);
        } else if (n.type === 'tool' && n.tool) {
          nodeLines.push(
            `${n.id}: tool ${n.tool.name} ${JSON.stringify(n.tool.params || {})}`,
          );
        } else if (n.type === 'end' && n.end?.message) {
          nodeLines.push(`${n.id}: ${n.end.message}`);
        }
      }
    }
    return [
      `技能名称: ${skill.name}`,
      skill.description ? `说明: ${skill.description}` : '',
      `工具标签: ${(skill.tools || []).join(', ') || '无'}`,
      nodeLines.length ? `工作流摘要:\n${nodeLines.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async generateEmbeddings(
    texts: string[],
    embeddingType: EmbeddingType,
    userId: number,
  ): Promise<number[][]> {
    const apiKey =
      await this.aiConfigService.resolveMinimaxEmbeddingApiKey(userId);
    const baseUrl =
      process.env.MINIMAX_API_BASE?.trim() || 'https://api.minimax.io';
    return callMinimaxEmbeddings(
      apiKey,
      baseUrl,
      EMBEDDING_MODEL,
      texts,
      embeddingType,
    );
  }

  private async generateSingleEmbedding(
    text: string,
    userId: number,
  ): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text], 'query', userId);
    if (!embeddings[0]) {
      throw new BadRequestException('Failed to generate embedding for query');
    }
    return embeddings[0];
  }

  /**
   * 写入/更新一条技能向量（仅 ACTIVE 入库；否则从索引删除）。
   */
  async syncSkill(skill: Skill): Promise<void> {
    await this.removeSkill(skill.id);
    if (skill.status !== SkillStatus.ACTIVE) {
      return;
    }
    const document = this.buildSkillEmbeddingText(skill);
    if (!document.trim()) {
      return;
    }
    const embeddings = await this.generateEmbeddings(
      [document],
      'db',
      skill.userId ?? 0,
    );
    const vector = embeddings[0];
    if (!vector) {
      this.logger.warn(`Skill ${skill.id}: empty embedding, skip index`);
      return;
    }
    const collectionId = await this.ensureCollection();
    const scope = skill.isGlobal ? 'global' : `u:${skill.userId}`;
    const id = `skill:${skill.id}`;
    await fetch(this.getCollectionUrl(`/${collectionId}/add`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: [id],
        embeddings: [vector.slice(0, EMBEDDING_DIMENSIONS)],
        documents: [document],
        metadatas: [
          {
            skillId: skill.id,
            scope,
            status: 'active',
            userId: skill.userId ?? 0,
            isGlobal: Boolean(skill.isGlobal),
          },
        ],
      }),
    });
  }

  async removeSkill(skillId: string): Promise<void> {
    try {
      const collectionId = await this.ensureCollection();
      await fetch(this.getCollectionUrl(`/${collectionId}/delete`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: { skillId },
        }),
      });
    } catch (e) {
      this.logger.warn(`removeSkill chroma: ${String(e)}`);
    }
  }

  /**
   * 按用户消息在「已激活候选 skillId」子集内做向量检索，返回按相似度排序的 skillId（最多 topK）。
   */
  async searchSkillIds(
    userId: number,
    query: string,
    candidateSkillIds: string[],
    topK: number,
  ): Promise<string[]> {
    if (!query.trim() || candidateSkillIds.length === 0) {
      return [];
    }
    const collectionId = await this.ensureCollection();
    const scopes = ['global', `u:${userId}`];
    const idSlice = candidateSkillIds.slice(0, 120);
    const queryEmbedding = await this.generateSingleEmbedding(query, userId);
    const response = await fetch(
      this.getCollectionUrl(`/${collectionId}/query`),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_embeddings: [queryEmbedding.slice(0, EMBEDDING_DIMENSIONS)],
          n_results: Math.min(Math.max(topK * 4, topK), 40),
          where: {
            $and: [
              { status: 'active' },
              { scope: { $in: scopes } },
              { skillId: { $in: idSlice } },
            ],
          },
          include: ['metadatas', 'distances'],
        }),
      },
    );
    if (!response.ok) {
      const t = await response.text();
      throw new Error(`Chroma skill query failed: ${response.status} ${t}`);
    }
    const body = (await response.json()) as ChromaQueryResponse;
    const row = body.ids?.[0];
    const metas = body.metadatas?.[0];
    const dists = body.distances?.[0];
    if (!row?.length) {
      return [];
    }
    type Row = { skillId: string; distance: number };
    const scored: Row[] = [];
    for (let i = 0; i < row.length; i++) {
      const meta = (metas?.[i] || {}) as { skillId?: string };
      const sid = typeof meta.skillId === 'string' ? meta.skillId : '';
      if (!sid || !candidateSkillIds.includes(sid)) continue;
      const d = dists?.[i] ?? 1;
      scored.push({ skillId: sid, distance: d });
    }
    scored.sort((a, b) => a.distance - b.distance);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const s of scored) {
      if (seen.has(s.skillId)) continue;
      seen.add(s.skillId);
      out.push(s.skillId);
      if (out.length >= topK) break;
    }
    return out;
  }
}
