import type { AssistantCard } from '../components/ResultCards';
import type { StreamEvent } from '../types';

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

const REDACTED_THINK_OPEN = '<redacted_thinking>';
const REDACTED_THINK_CLOSE = '</redacted_thinking>';
const LEGACY_THINK_OPEN = '<think>';
const LEGACY_THINK_CLOSE = '</think>';

/** 正文里误带的思考标签（服务端应拆 event，此处兜底） */
export function stripRedactedThinkingBlocks(text: string): string {
  if (
    !text.includes(REDACTED_THINK_OPEN) &&
    !text.includes(LEGACY_THINK_OPEN)
  ) {
    return text;
  }
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const redactedRe = new RegExp(
    `${esc(REDACTED_THINK_OPEN)}[\\s\\S]*?${esc(REDACTED_THINK_CLOSE)}`,
    'gi',
  );
  const legacyRe = new RegExp(
    `${esc(LEGACY_THINK_OPEN)}[\\s\\S]*?${esc(LEGACY_THINK_CLOSE)}`,
    'gi',
  );
  return text.replace(redactedRe, '').replace(legacyRe, '').trim();
}

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

function extractLabeledBlock(
  text: string,
  label: string,
  succeedingLabels: string[],
  searchFrom = 0,
): string | undefined {
  const tail = text.slice(searchFrom);
  const withNl = `\n${label}：`;
  const bare = `${label}：`;
  const withNlIdx = tail.indexOf(withNl);
  const bareIdx = tail.indexOf(bare);
  let relIdx: number;
  let markerLen: number;
  if (withNlIdx !== -1 && (bareIdx === -1 || withNlIdx <= bareIdx)) {
    relIdx = withNlIdx;
    markerLen = withNl.length;
  } else if (bareIdx !== -1) {
    relIdx = bareIdx;
    markerLen = bare.length;
  } else {
    return undefined;
  }
  const from = searchFrom + relIdx + markerLen;
  let end = text.length;
  for (const succ of succeedingLabels) {
    for (const m of [`\n${succ}：`, `${succ}：`] as const) {
      const j = text.indexOf(m, from);
      if (j !== -1 && j < end) end = j;
    }
  }
  const raw = text.slice(from, end).trim();
  return raw || undefined;
}

export const parseWeatherCardData = (
  content: string,
): Extract<AssistantCard, { type: 'weather_query' }>['data'] | null => {
  const trimmed = content.replace(/\r\n/g, '\n').trim();
  // 匹配格式：城市+日期+天气：当前温度X°C，最高温度X°C，最低温度X°C，天气，风速Xkm/h。
  const match = trimmed.match(
    /^(.+?)(今日|今天|明日|明天|后天|大后日|\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2})天气：当前温度([^，]+)，最高温度([^，]+)，最低温度([^，]+)，([^，]+)，风速([^，]+)km\/h。/,
  );
  if (!match) return null;
  const bodyStart = match[0].length;
  const clothingAdvice = extractLabeledBlock(
    trimmed,
    '穿衣建议',
    ['空气质量', '感冒指数'],
    bodyStart,
  );
  const airQualityText = extractLabeledBlock(
    trimmed,
    '空气质量',
    ['感冒指数'],
    bodyStart,
  );
  const coldIndexText = extractLabeledBlock(trimmed, '感冒指数', [], bodyStart);
  return {
    city: match[1].trim(),
    dateLabel: match[2].trim(),
    temperatureText: match[3].trim(),
    maxTemperatureText: match[4].trim(),
    minTemperatureText: match[5].trim(),
    weatherText: match[6]?.trim(),
    windspeedText: match[7]?.trim(),
    clothingAdvice,
    airQualityText,
    coldIndexText,
  };
};
