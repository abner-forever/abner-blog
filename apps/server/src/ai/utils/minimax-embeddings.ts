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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const candidates: Array<{
    url: string;
    body: Record<string, unknown>;
    legacySingleText?: boolean;
  }> = [
    {
      // OpenAI-compatible route (MiniMax / Ollama OpenAI compat)
      url: `${cleanBaseUrl}/v1/embeddings`,
      body: {
        model,
        input: normalized.length === 1 ? normalized[0] : normalized,
      },
    },
    {
      // Ollama preferred route
      url: `${cleanBaseUrl}/api/embed`,
      body: {
        model,
        input: normalized,
      },
    },
    {
      // MiniMax legacy route compatibility
      url: `${cleanBaseUrl}/v1/embeddings`,
      body: {
        model,
        type,
        texts: normalized,
        input: normalized,
      },
    },
    {
      // Ollama legacy route; single prompt each call
      url: `${cleanBaseUrl}/api/embeddings`,
      body: {
        model,
      },
      legacySingleText: true,
    },
  ];

  let lastFailure = '';
  for (const candidate of candidates) {
    if (candidate.legacySingleText) {
      const vectors: number[][] = [];
      let failed = false;
      for (const text of normalized) {
        let response: Response;
        try {
          response = await fetch(candidate.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...candidate.body,
              prompt: text,
            }),
          });
        } catch (e) {
          const detail = formatFetchError(e);
          lastFailure = `fetch_error url=${candidate.url} model=${String(model)} detail=${detail}`;
          continue;
        }
        const raw = await response.text();
        if (!response.ok) {
          lastFailure = `${response.status} - ${raw}`;
          failed = true;
          break;
        }
        try {
          const one = extractEmbeddingVectorsFromResponse(raw);
          if (!one[0]) {
            throw new BadRequestException('Empty embedding vector');
          }
          vectors.push(one[0]);
        } catch (e) {
          if (e instanceof BadRequestException) {
            lastFailure = e.message;
            failed = true;
            break;
          }
          throw e;
        }
      }
      if (!failed && vectors.length === normalized.length) {
        return vectors;
      }
      continue;
    }

    let response: Response;
    try {
      response = await fetch(candidate.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(candidate.body),
      });
    } catch (e) {
      const detail = formatFetchError(e);
      lastFailure = `fetch_error url=${candidate.url} model=${String(model)} detail=${detail}`;
      continue;
    }
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

function formatFetchError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return typeof error === 'string' ? error : JSON.stringify(error);
  }
  const e = error as {
    name?: string;
    message?: string;
    code?: string;
    errno?: string | number;
    type?: string;
    cause?: unknown;
  };
  const cause =
    e.cause && typeof e.cause === 'object'
      ? (e.cause as {
          code?: string;
          message?: string;
          errno?: string | number;
        })
      : null;
  return [
    `name=${e.name || 'UnknownError'}`,
    `message=${e.message || ''}`,
    `code=${e.code || cause?.code || ''}`,
    `errno=${String(e.errno ?? cause?.errno ?? '')}`,
    `type=${e.type || ''}`,
    `cause=${cause?.message || ''}`,
  ].join(' ');
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

  const embeddingsField = data.embeddings;
  if (Array.isArray(embeddingsField) && embeddingsField.length > 0) {
    return embeddingsField as number[][];
  }

  const embeddingField = data.embedding;
  if (Array.isArray(embeddingField) && embeddingField.length > 0) {
    return [embeddingField as number[]];
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
