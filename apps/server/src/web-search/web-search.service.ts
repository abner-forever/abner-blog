import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SEARCH_TIMEOUT_MS = 25_000;
const PAGE_FETCH_TIMEOUT_MS = 20_000;
const MAX_PAGE_BYTES = 512 * 1024;
const MAX_SNIPPET_CHARS = 480;
const MAX_RESULTS = 8;
const MAX_PAGE_TEXT = 12_000;

@Injectable()
export class WebSearchService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 使用 Tavily（优先）或 Brave 返回检索摘要文本（不含对话包装）。
   */
  async searchDigest(rawQuery: string): Promise<string> {
    const trimmed = rawQuery.trim();
    if (!trimmed) {
      throw new Error('请输入检索关键词。');
    }
    const q = this.normalizeSearchQuery(trimmed);
    const tavilyKey =
      this.configService.get<string>('TAVILY_API_KEY')?.trim() || '';
    const braveKey =
      this.configService.get<string>('BRAVE_SEARCH_API_KEY')?.trim() || '';

    if (!tavilyKey && !braveKey) {
      throw new Error(
        '服务端未配置联网搜索密钥：请设置 TAVILY_API_KEY（推荐）或 BRAVE_SEARCH_API_KEY。',
      );
    }

    if (tavilyKey) {
      return this.searchTavily(q, tavilyKey);
    }
    return this.searchBrave(q, braveKey);
  }

  /** 抓取网页正文片段（仅 http/https，带简单 SSRF 限制）。 */
  async fetchPagePreview(rawUrl: string): Promise<string> {
    const urlStr = rawUrl.trim();
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      throw new Error('无效的 URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('仅支持 http/https 链接');
    }
    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.local') ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      throw new Error('不允许抓取该地址');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept:
            'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
          'User-Agent':
            'abner-blog-web-search-mcp/1.0 (+https://github.com/modelcontextprotocol)',
        },
        signal: controller.signal,
      });
      const lenHeader = res.headers.get('content-length');
      if (lenHeader) {
        const n = parseInt(lenHeader, 10);
        if (Number.isFinite(n) && n > MAX_PAGE_BYTES) {
          throw new Error('页面体积过大，已拒绝下载');
        }
      }
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_PAGE_BYTES) {
        throw new Error('页面体积过大，已截断前仍超限');
      }
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buf);
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      let body = text;
      if (contentType.includes('text/html')) {
        body = this.stripHtmlToText(text);
      } else {
        body = text.replace(/\s+/g, ' ').trim();
      }
      return this.truncate(body, MAX_PAGE_TEXT);
    } finally {
      clearTimeout(timer);
    }
  }

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

  private stripHtmlToText(html: string): string {
    let s = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
    s = s.replace(/<[^>]+>/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
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
