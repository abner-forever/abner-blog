import { BadRequestException } from '@nestjs/common';

/** 与知识库 / 技能向量入库、查询一致 */
export type MinimaxEmbeddingType = 'db' | 'query';

/**
 * MiniMax 嵌入：旧版文档见历史接口
 * https://platform.minimaxi.com/docs/faq/history-query（Embeddings 条目）。
 * 新文档中心以 OpenAI 兼容为主（同 host 下 `/v1/embeddings`），请求体常为 `{ model, input }`。
 * 此处先尝试 OpenAI 形状，再回退旧版 `{ type, texts, input }`，避免平台迁移后单一路径失效。
 */
export async function callMinimaxEmbeddings(
  apiKey: string,
  baseUrl: string,
  model: string,
  texts: string[],
  type: MinimaxEmbeddingType,
): Promise<number[][]> {
  const normalized = texts.map((t) => t.trim()).filter((t) => t.length > 0);
  if (normalized.length === 0) {
    throw new BadRequestException('Embedding text cannot be empty');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/v1/embeddings`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  const bodies: Record<string, unknown>[] = [
    {
      model,
      input: normalized.length === 1 ? normalized[0] : normalized,
    },
    {
      model,
      type,
      texts: normalized,
      input: normalized,
    },
  ];

  let lastFailure = '';
  for (const body of bodies) {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const raw = await response.text();
    if (!response.ok) {
      lastFailure = `${response.status} - ${raw}`;
      continue;
    }
    try {
      return extractEmbeddingVectorsFromResponse(raw);
    } catch (e) {
      if (e instanceof BadRequestException) {
        const msg = e.message;
        lastFailure = msg;
        if (!shouldFallbackToLegacyBody(msg)) {
          throw e;
        }
        continue;
      }
      throw e;
    }
  }

  throw new BadRequestException(`Embedding API error: ${lastFailure}`);
}

function shouldFallbackToLegacyBody(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('unknown embedding response') ||
    lower.includes('invalid params') ||
    lower.includes('missing required parameter') ||
    lower.includes('expr_path=texts')
  );
}

function extractEmbeddingVectorsFromResponse(raw: string): number[][] {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new BadRequestException(
      `Embedding API invalid JSON: ${raw.slice(0, 240)}`,
    );
  }

  const baseResp = data.base_resp as
    | { status_code: number; status_msg: string }
    | undefined;
  if (baseResp && baseResp.status_code !== 0) {
    throw new BadRequestException(
      `Embedding API error: ${baseResp.status_msg ?? raw}`,
    );
  }

  const vectorsField = data.vectors;
  if (Array.isArray(vectorsField) && vectorsField.length > 0) {
    return vectorsField as number[][];
  }

  const dataField = data.data;
  if (Array.isArray(dataField) && dataField.length > 0) {
    return dataField.map(
      (item): number[] => (item as { embedding: number[] }).embedding,
    );
  }

  if (
    vectorsField === null ||
    (Array.isArray(vectorsField) && vectorsField.length === 0)
  ) {
    return [];
  }

  throw new BadRequestException(`Unknown embedding response format: ${raw}`);
}
