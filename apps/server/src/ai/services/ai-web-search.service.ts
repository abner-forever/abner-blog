import { Injectable, Logger } from '@nestjs/common';
import { AIChatResponseService } from './ai-chat-response.service';

const SEARCH_TIMEOUT_MS = 25_000;
const MAX_SNIPPET_CHARS = 480;
const MAX_RESULTS = 8;

export type WebSearchPrepareOk = { ok: true; prompt: string };
export type WebSearchPrepareErr = { ok: false; message: string };

@Injectable()
export class AIWebSearchService {
  private readonly logger = new Logger(AIWebSearchService.name);

  constructor(private readonly chatResponse: AIChatResponseService) {}

  /**
   * 执行联网检索并生成可直接送入多轮对话的完整用户侧 Prompt（含系统约束与摘要）。
   */
  async preparePrompt(
    userQuestion: string,
  ): Promise<WebSearchPrepareOk | WebSearchPrepareErr> {
    const trimmed = userQuestion.trim();
    if (!trimmed) {
      return { ok: false, message: '请输入要检索的问题。' };
    }
    const query = this.normalizeSearchQuery(trimmed);
    const tavilyKey = process.env.TAVILY_API_KEY?.trim();
    const braveKey = process.env.BRAVE_SEARCH_API_KEY?.trim();

    if (!tavilyKey && !braveKey) {
      return {
        ok: false,
        message:
          '服务端未配置联网搜索密钥：请在环境变量中设置 TAVILY_API_KEY（推荐）或 BRAVE_SEARCH_API_KEY。',
      };
    }

    try {
      let digest: string;
      if (tavilyKey) {
        digest = await this.searchTavily(query, tavilyKey);
      } else {
        digest = await this.searchBrave(query, braveKey);
      }
      if (!digest.trim()) {
        return {
          ok: false,
          message: '未检索到可用摘要，请换种说法或稍后再试。',
        };
      }
      const prompt = this.chatResponse.buildWebSearchChatPrompt(
        trimmed,
        digest,
      );
      return { ok: true, prompt };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Web search failed: ${msg}`);
      return {
        ok: false,
        message: `联网搜索暂时失败：${msg}`,
      };
    }
  }

  /** 去掉常见口语前缀，得到更适合搜索引擎的 query */
  normalizeSearchQuery(raw: string): string {
    let q = raw.trim();
    q = q.replace(/^(请|麻烦|能否|可不可以)?(你)?(帮我|帮助我)?/u, '');
    q = q.replace(
      /^(用|使用)?(百度|谷歌|Google|必应|Bing)?(搜|搜索|检索|查)(一下)?[:：\s]*/iu,
      '',
    );
    q = q.replace(/^(联网|网上|在线)(搜|搜索|查)(一下)?[:：\s]*/u, '');
    q = q.replace(/^(搜|搜索|检索)一下[:：\s]*/u, '');
    q = q.replace(/^(查一下|查下)网上的?[:：\s]*/u, '');
    q = q.replace(/^(web\s*search|search\s+the\s+web)[:：\s]*/iu, '');
    const out = q.trim();
    return out || raw.trim();
  }

  private async searchTavily(query: string, apiKey: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          max_results: MAX_RESULTS,
          include_answer: true,
        }),
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Tavily HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error('Tavily 返回非 JSON');
      }
      return this.formatTavilyDigest(data);
    } finally {
      clearTimeout(timer);
    }
  }

  private formatTavilyDigest(data: Record<string, unknown>): string {
    const lines: string[] = [];
    const ans = data.answer;
    if (typeof ans === 'string' && ans.trim()) {
      lines.push(`【检索引擎摘要】\n${ans.trim()}`);
    }
    const results = data.results;
    if (!Array.isArray(results) || results.length === 0) {
      return lines.join('\n\n');
    }
    lines.push('【网页摘录】');
    let i = 0;
    for (const item of results) {
      if (i >= MAX_RESULTS) break;
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      const title = typeof r.title === 'string' ? r.title.trim() : '';
      const url = typeof r.url === 'string' ? r.url.trim() : '';
      const content =
        typeof r.content === 'string'
          ? r.content.trim()
          : typeof r.snippet === 'string'
            ? r.snippet.trim()
            : '';
      if (!title && !content) continue;
      i += 1;
      const snippet = this.truncate(content, MAX_SNIPPET_CHARS);
      lines.push(
        `${i}. ${title || '(无标题)'}\n   链接：${url || '—'}\n   摘录：${snippet || '—'}`,
      );
    }
    return lines.join('\n\n');
  }

  private async searchBrave(query: string, apiKey: string): Promise<string> {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(MAX_RESULTS));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': apiKey,
        },
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Brave HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        throw new Error('Brave 返回非 JSON');
      }
      return this.formatBraveDigest(data);
    } finally {
      clearTimeout(timer);
    }
  }

  private formatBraveDigest(data: Record<string, unknown>): string {
    const web = data.web as Record<string, unknown> | undefined;
    const results = web?.results;
    if (!Array.isArray(results) || results.length === 0) {
      return '';
    }
    const lines: string[] = ['【网页摘录】'];
    let i = 0;
    for (const item of results) {
      if (i >= MAX_RESULTS) break;
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      const title = typeof r.title === 'string' ? r.title.trim() : '';
      const url = typeof r.url === 'string' ? r.url.trim() : '';
      const desc =
        typeof r.description === 'string' ? r.description.trim() : '';
      if (!title && !desc) continue;
      i += 1;
      const snippet = this.truncate(desc, MAX_SNIPPET_CHARS);
      lines.push(
        `${i}. ${title || '(无标题)'}\n   链接：${url || '—'}\n   摘录：${snippet || '—'}`,
      );
    }
    return lines.join('\n\n');
  }

  private truncate(text: string, max: number): string {
    const t = text.replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return `${t.slice(0, max)}…`;
  }
}
