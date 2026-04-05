import type { AssistantCard } from './components/ResultCards';
import type { StreamEvent } from './types';

export const formatEventDateTime = (dateStr?: string): string => {
  if (!dateStr) return '未提供';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '未提供';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const parseSSEChunk = (rawChunk: string): StreamEvent | null => {
  const line = rawChunk
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item.startsWith('data:'));
  if (!line) return null;
  const content = line.replace(/^data:\s*/, '');
  if (!content) return null;
  try {
    return JSON.parse(content) as StreamEvent;
  } catch {
    return null;
  }
};

export const parseWeatherCardData = (
  content: string,
): Extract<AssistantCard, { type: 'weather_query' }>['data'] | null => {
  const trimmed = content.trim();
  const match = trimmed.match(
    /^(.+?)(今天|明天|后天|\d{4}-\d{2}-\d{2})天气：当前温度([^，]+)，最高([^，]+)，最低([^，]+)，风速([^，]+)(?:，天气([^。]+))?。?$/,
  );
  if (!match) return null;
  return {
    city: match[1].trim(),
    dateLabel: match[2].trim(),
    temperatureText: match[3].trim(),
    maxTemperatureText: match[4].trim(),
    minTemperatureText: match[5].trim(),
    windspeedText: match[6].trim(),
    weatherText: match[7]?.trim(),
  };
};
