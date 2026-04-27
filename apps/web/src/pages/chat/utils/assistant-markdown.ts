import type { Message } from '../types';

/**
 * 助手消息：`content` 由 SSE 实时累加，`displayContent` 由打字机从队列消费。
 * 流结束瞬间落盘时 `displayContent` 可能尚未追上 `content`，刷新/分享会误用较短字段。
 * 在非流式展示场景下应以较长者为准（通常 `content` 为完整正文）。
 */
export function canonicalAssistantMarkdown(
  content: string | undefined,
  displayContent: string | undefined,
): string {
  const c = content ?? '';
  const d = displayContent ?? '';
  return c.length >= d.length ? c : d;
}

/** 对话列表渲染：流式进行中仍走打字机，完成后与落盘一致使用 canonical。 */
export function assistantMarkdownForRender(
  m: Pick<Message, 'role' | 'content' | 'displayContent' | 'isComplete'>,
): string {
  if (m.role !== 'assistant') {
    return m.content ?? '';
  }
  if (m.isComplete === false) {
    return normalizeJsonToCodeFence(m.displayContent || m.content || '');
  }
  return normalizeJsonToCodeFence(
    canonicalAssistantMarkdown(m.content, m.displayContent),
  );
}

function normalizeJsonToCodeFence(content: string): string {
  const text = content.trim();
  if (!text || text.includes('```')) return content;

  const directWrapped = tryWrapWholeJson(text);
  if (directWrapped) return directWrapped;

  const wrappedInner = wrapFirstJsonBlock(content);
  return wrappedInner ?? content;
}

function tryWrapWholeJson(text: string): string | null {
  if (!looksLikeJson(text)) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isJsonContainer(parsed)) return null;
    return `\`\`\`json\n${text}\n\`\`\``;
  } catch {
    return null;
  }
}

function wrapFirstJsonBlock(content: string): string | null {
  const lines = content.split('\n');
  for (let start = 0; start < lines.length; start += 1) {
    const first = lines[start]?.trim();
    if (!first || !looksLikeJsonStart(first)) continue;

    for (let end = lines.length - 1; end >= start; end -= 1) {
      const candidate = lines.slice(start, end + 1).join('\n').trim();
      if (!looksLikeJson(candidate)) continue;
      try {
        const parsed: unknown = JSON.parse(candidate);
        if (!isJsonContainer(parsed)) continue;
        const before = lines.slice(0, start).join('\n').trimEnd();
        const after = lines.slice(end + 1).join('\n').trimStart();
        const block = `\`\`\`json\n${candidate}\n\`\`\``;
        if (before && after) return `${before}\n\n${block}\n\n${after}`;
        if (before) return `${before}\n\n${block}`;
        if (after) return `${block}\n\n${after}`;
        return block;
      } catch {
        // ignore parse failure and keep searching
      }
    }
  }
  return null;
}

function looksLikeJsonStart(text: string): boolean {
  return text.startsWith('{') || text.startsWith('[');
}

function looksLikeJson(text: string): boolean {
  return (
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('[') && text.endsWith(']'))
  );
}

function isJsonContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return typeof value === 'object' && value !== null;
}
