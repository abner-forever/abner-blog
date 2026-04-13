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
    return m.displayContent || m.content || '';
  }
  return canonicalAssistantMarkdown(m.content, m.displayContent);
}
