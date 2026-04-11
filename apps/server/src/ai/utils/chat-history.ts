import type { ChatResponseDto } from '../dto/extraction-result.dto';
import { buildScheduleSummary } from './response-builders';

function getStringField(
  data: Record<string, unknown>,
  key: string,
): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNumberField(
  data: Record<string, unknown>,
  key: string,
): number | null {
  const value = data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function buildIntentMemoryReply(result: ChatResponseDto): string | null {
  const data = result.data || {};
  const title = getStringField(data, 'title');
  const id = getNumberField(data, 'id');

  switch (result.type) {
    case 'todo_created':
      return title ? `已创建待办：${title}。` : '已创建一个新的待办事项。';
    case 'event_created':
      return title ? `已创建日程：${title}。` : '已创建一个新的日程。';
    case 'todo_updated':
      return title ? `已更新待办：${title}。` : '已更新一个待办事项。';
    case 'event_updated':
      return title ? `已更新日程：${title}。` : '已更新一个日程。';
    case 'todo_deleted':
      if (title) return `已删除待办：${title}。`;
      if (typeof id === 'number') return `已删除待办（ID：${id}）。`;
      return '已删除一个待办事项。';
    case 'event_deleted':
      if (title) return `已删除日程：${title}。`;
      if (typeof id === 'number') return `已删除日程（ID：${id}）。`;
      return '已删除一个日程。';
    case 'schedule_query':
      return buildScheduleSummary(result.scheduleData);
    case 'clarification_needed': {
      const suggestion = result.clarification?.suggestion?.trim();
      if (suggestion) return `我需要你补充信息后才能继续：${suggestion}`;
      return '我需要补充信息后才能继续处理这个请求。';
    }
    case 'error':
      return result.error?.trim()
        ? `处理该请求时遇到问题：${result.error.trim()}`
        : '处理该请求时遇到问题。';
    case 'chat':
    default:
      return null;
  }
}
