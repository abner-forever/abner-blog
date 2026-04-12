import type { CreateBlogDto } from '@services/generated/model';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 模型常输出 abstract/excerpt 等别名；对外仍映射为 CreateBlogDto.summary */
function firstNonEmptyTrimmedString(
  o: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.length > 0) return t;
    }
  }
  return '';
}

function tryJsonToDto(raw: string): CreateBlogDto | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const summary = firstNonEmptyTrimmedString(o, [
    'summary',
    'abstract',
    'excerpt',
    'description',
  ]);
  const content = typeof o.content === 'string' ? o.content.trim() : '';
  if (!title || !summary || !content) return null;
  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : undefined;
  const isPublished = typeof o.isPublished === 'boolean' ? o.isPublished : undefined;
  const cover = typeof o.cover === 'string' ? o.cover : undefined;
  const mdTheme = typeof o.mdTheme === 'string' ? o.mdTheme : undefined;
  return {
    title,
    summary,
    content,
    ...(tags?.length ? { tags } : {}),
    ...(isPublished !== undefined ? { isPublished } : {}),
    ...(cover ? { cover } : {}),
    ...(mdTheme ? { mdTheme } : {}),
  };
}

function looksLikeBlogPayload(d: CreateBlogDto): boolean {
  return d.title.length >= 1 && d.summary.length >= 2 && d.content.length >= 10;
}

/**
 * 从 `startAt` 处的 `{` 起截取与根对象配平的 JSON（在双引号字符串内忽略括号，并跟踪 []）。
 * 解决 content 内含 Markdown 代码块（```）时，非贪婪 ``` 误匹配到内层围栏的问题。
 */
export function extractBalancedJsonObject(text: string, startAt: number): string | null {
  if (startAt >= text.length || text[startAt] !== '{') return null;
  let braces = 0;
  let brackets = 0;
  let inStr = false;
  let esc = false;
  const n = text.length;

  for (let i = startAt; i < n; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{') {
      braces++;
      continue;
    }
    if (c === '}') {
      braces--;
      if (braces === 0 && brackets === 0) {
        return text.slice(startAt, i + 1);
      }
      continue;
    }
    if (c === '[') {
      brackets++;
      continue;
    }
    if (c === ']') {
      brackets--;
      continue;
    }
  }
  return null;
}

/** 返回 { dto, blockStart, blockEnd }，blockEnd 为闭合 ``` 之后索引（不含），用于整段删除 */
function tryParseLabeledFenceBlock(
  text: string,
  label: string,
): { dto: CreateBlogDto; blockStart: number; blockEnd: number } | null {
  const openRe = new RegExp(
    '```\\s*' + escapeRegExp(label) + '\\s*\\r?\\n?',
    'gi',
  );
  for (const m of text.matchAll(openRe)) {
    const blockStart = m.index ?? 0;
    const afterOpen = blockStart + m[0].length;
    let i = afterOpen;
    while (i < text.length && /[\s\r\n]/.test(text[i])) i++;
    if (text[i] !== '{') continue;
    const jsonStr = extractBalancedJsonObject(text, i);
    if (!jsonStr) continue;
    const dto = tryJsonToDto(jsonStr);
    if (!dto || !looksLikeBlogPayload(dto)) continue;
    let end = i + jsonStr.length;
    while (end < text.length && /[\s\r\n]/.test(text[end])) end++;
    let blockEnd = end;
    if (text.slice(end, end + 3) === '```') {
      blockEnd = end + 3;
    }
    return { dto, blockStart, blockEnd };
  }
  return null;
}

function tryParseJsonFenceBlocks(text: string): {
  dto: CreateBlogDto;
  blockStart: number;
  blockEnd: number;
} | null {
  const openRe = /```\s*json\s*\r?\n?/gi;
  let best: { dto: CreateBlogDto; blockStart: number; blockEnd: number } | null = null;
  for (const m of text.matchAll(openRe)) {
    const blockStart = m.index ?? 0;
    const afterOpen = blockStart + m[0].length;
    let i = afterOpen;
    while (i < text.length && /[\s\r\n]/.test(text[i])) i++;
    if (text[i] !== '{') continue;
    const jsonStr = extractBalancedJsonObject(text, i);
    if (!jsonStr) continue;
    const dto = tryJsonToDto(jsonStr);
    if (!dto || !looksLikeBlogPayload(dto)) continue;
    let end = i + jsonStr.length;
    while (end < text.length && /[\s\r\n]/.test(text[end])) end++;
    let blockEnd = end;
    if (text.slice(end, end + 3) === '```') {
      blockEnd = end + 3;
    }
    best = { dto, blockStart, blockEnd };
  }
  return best;
}

/**
 * 行首 Markdown 围栏（可选语言）：模型常输出无语言标签的 ```，渲染为「text」；或 ```text 等，此前无法识别。
 * 仅匹配「新行开头 + ``` + 换行 + 可选空白 + {」，避免误匹配 JSON 字符串里换行后的 ```。
 */
function tryParseLineStartMarkdownFenceBlogBlock(text: string): {
  dto: CreateBlogDto;
  blockStart: number;
  blockEnd: number;
} | null {
  const openRe = /(?:^|\n)(```[^\n\r`]*\r?\n)(\s*)(\{)/g;
  type Hit = {
    dto: CreateBlogDto;
    blockStart: number;
    blockEnd: number;
    score: number;
  };
  const hits: Hit[] = [];
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(text)) !== null) {
    const braceAt = m.index + m[0].length - 1;
    if (text[braceAt] !== '{') continue;
    const jsonStr = extractBalancedJsonObject(text, braceAt);
    if (!jsonStr) continue;
    const dto = tryJsonToDto(jsonStr);
    if (!dto || !looksLikeBlogPayload(dto)) continue;
    const leadingNl = m[0][0] === '\n' ? 1 : 0;
    const blockStart = m.index + leadingNl;
    let end = braceAt + jsonStr.length;
    while (end < text.length && /[\s\r\n]/.test(text[end])) end++;
    let blockEnd = end;
    const hasClose = text.slice(end, end + 3) === '```';
    if (hasClose) {
      blockEnd = end + 3;
    }
    hits.push({
      dto,
      blockStart,
      blockEnd,
      score: dto.content.length * 10 + (hasClose ? 1 : 0),
    });
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.score - a.score);
  const best = hits[0];
  return { dto: best.dto, blockStart: best.blockStart, blockEnd: best.blockEnd };
}

/** 无围栏时，行首裸 JSON（仍以 title/summary/content 校验降低误报） */
function tryParseLineStartUnfencedBlogJson(text: string): {
  dto: CreateBlogDto;
  blockStart: number;
  blockEnd: number;
} | null {
  const openRe = /(?:^|\n)(\{\s*"title"\s*:)/g;
  const hits: Array<{
    dto: CreateBlogDto;
    blockStart: number;
    blockEnd: number;
    score: number;
  }> = [];
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(text)) !== null) {
    const braceAt = m.index + (m[0][0] === '\n' ? 1 : 0);
    const jsonStr = extractBalancedJsonObject(text, braceAt);
    if (!jsonStr) continue;
    const dto = tryJsonToDto(jsonStr);
    if (!dto || !looksLikeBlogPayload(dto)) continue;
    hits.push({
      dto,
      blockStart: braceAt,
      blockEnd: braceAt + jsonStr.length,
      score: dto.content.length,
    });
  }
  if (hits.length === 0) return null;
  hits.sort((a, b) => b.score - a.score);
  const best = hits[0];
  return { dto: best.dto, blockStart: best.blockStart, blockEnd: best.blockEnd };
}

function pickBlogPublishBlock(text: string): {
  dto: CreateBlogDto;
  blockStart: number;
  blockEnd: number;
} | null {
  const a = tryParseLabeledFenceBlock(text, 'abner-blog-publish');
  if (a) return a;
  const aShort = tryParseLabeledFenceBlock(text, 'abner');
  if (aShort) return aShort;
  const b = tryParseLabeledFenceBlock(text, 'blog-publish');
  if (b) return b;
  const j = tryParseJsonFenceBlocks(text);
  if (j) return j;
  const f = tryParseLineStartMarkdownFenceBlogBlock(text);
  if (f) return f;
  return tryParseLineStartUnfencedBlogJson(text);
}

/**
 * 从助手正文中提取「一键发帖」机器可读块。
 * 支持 ```abner-blog-publish / ```abner / ```blog-publish / ```json / 行首 ```（任意语言或空）+ JSON / 行首裸 JSON；内层 JSON 用括号配平提取，避免 content 里 Markdown 代码块截断。JSON 摘要字段兼容 summary / abstract / excerpt / description。
 */
export function parseAbnerBlogPublishDraft(text: string): CreateBlogDto | null {
  if (!text || typeof text !== 'string') return null;
  return pickBlogPublishBlock(text)?.dto ?? null;
}

function isTrailingBlogTagMetaLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 600) return false;
  return /^(标签|Tags?)\s*[：:]\s*\S/.test(t);
}

function isTrailingBlogPublishUiLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 14 || t.length > 1200) return false;
  if (/如需调整标题、内容或标签/.test(t)) return true;
  if (/已准备好发布数据/.test(t) && /(发布到博客|按钮)/.test(t)) return true;
  if (/用户可在本条助手消息下方/.test(t) && /(发布到博客|JSON)/.test(t)) return true;
  if (/再次提醒/.test(t) && /发布到博客/.test(t)) return true;
  if (/实际创建文章需用户/.test(t) && /发布到博客/.test(t)) return true;
  if (/POST\s*\/api\/blogs/.test(t) && t.length < 500) return true;
  if (/将上述 JSON 提交/.test(t) && /发布到博客/.test(t)) return true;
  return false;
}

/**
 * 去掉发帖 JSON 围栏后，模型常在文末重复「标签：…」与「请点击发布到博客」等说明；标签已在 JSON.tags，按钮由界面提供，不应留在正文/发帖 content。
 */
export function stripBlogPublishDisplayNoise(body: string): string {
  if (!body) return body;
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let end = lines.length;
  const maxStrip = 24;
  let stripped = 0;
  while (end > 0 && stripped < maxStrip) {
    const line = lines[end - 1];
    if (line.trim() === '') {
      end--;
      stripped++;
      continue;
    }
    if (
      isTrailingBlogPublishUiLine(line) ||
      isTrailingBlogTagMetaLine(line)
    ) {
      end--;
      stripped++;
      continue;
    }
    break;
  }
  return lines
    .slice(0, end)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();
}

/** 从展示用正文中移除发帖围栏整块（含闭合 ```），优先级与 parse 一致 */
export function stripAbnerBlogPublishBlock(text: string): string {
  if (!text) return text;
  const hit = pickBlogPublishBlock(text);
  if (!hit) return text;
  const raw = (text.slice(0, hit.blockStart) + text.slice(hit.blockEnd)).trimEnd();
  return stripBlogPublishDisplayNoise(raw);
}

/**
 * JSON 的 content 仅为「正文在上方」类占位（一键发布实际提交的是该字段，与上文 Markdown 无关）。
 */
export function looksLikePlaceholderBlogJsonContent(content: string): boolean {
  const s = content.trim();
  if (s.length === 0) return true;
  if (s.length >= 900) return false;
  if (/<![\s\S]*?-->/.test(s)) {
    const rest = s.replace(/<!--[\s\S]*?-->/g, '').trim();
    if (rest.length < 64) return true;
  }
  if (/已在(上方|上面|上文)/.test(s)) return true;
  if (/正文.*(已在|见).*(上方|上面|上文)/.test(s)) return true;
  if (
    /见上文|同上|详见上文|省略正文|正文省略/.test(s) &&
    s.length < 400
  ) {
    return true;
  }
  if (
    /complete\s+markdown/i.test(s) &&
    /above|omitted|elsewhere/i.test(s) &&
    s.length < 400
  ) {
    return true;
  }
  if (/^(tbd|n\/a|none|n\.a\.?)$/i.test(s)) return true;
  return false;
}

const MIN_STRIPPED_BODY_FOR_MERGE = 48;

/**
 * 当 JSON content 为占位而正文在围栏上方时，用去掉围栏后的正文作为可发布的 content。
 */
export function mergeBlogPublishDraftWithStrippedBody(
  draft: CreateBlogDto,
  strippedMarkdown: string,
): CreateBlogDto {
  const body = strippedMarkdown.trim();
  if (body.length < MIN_STRIPPED_BODY_FOR_MERGE) return draft;
  if (!looksLikePlaceholderBlogJsonContent(draft.content)) return draft;
  return { ...draft, content: body };
}
