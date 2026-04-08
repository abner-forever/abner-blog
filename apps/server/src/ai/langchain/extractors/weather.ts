import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ChatLLM } from '../model';
import { getTextContent, parseJson } from '../parsers';
import { WEATHER_QUERY_EXTRACTION_PROMPT } from '../prompts';

export interface WeatherQueryContext {
  city: string | null;
  adm?: string;
  date: string;
  label: string;
}

export async function extractWeatherQueryContext(
  llm: ChatLLM,
  userInput: string,
  currentDate: string,
): Promise<WeatherQueryContext> {
  const fallbackDate = extractWeatherDateByRules(userInput, currentDate);
  const prompt = WEATHER_QUERY_EXTRACTION_PROMPT.replace(
    '{currentDate}',
    currentDate,
  ).replace('{userInput}', userInput);

  try {
    const result = await llm.invoke([
      new SystemMessage('你是一个信息提取助手，只输出JSON。'),
      new HumanMessage(prompt),
    ]);
    const content = getTextContent(result);
    const parsed = parseJson(content);
    const city =
      typeof parsed?.city === 'string'
        ? normalizeExtractedWeatherCity(parsed.city)
        : null;
    const adm =
      typeof parsed?.adm === 'string' && parsed.adm.trim()
        ? parsed.adm.trim()
        : undefined;
    const date =
      typeof parsed?.date === 'string' ? normalizeIsoDate(parsed.date) : null;
    if (!date) {
      return {
        city,
        adm,
        date: fallbackDate.date,
        label: fallbackDate.label,
      };
    }
    const label =
      typeof parsed?.label === 'string' && parsed.label.trim()
        ? parsed.label.trim()
        : deriveWeatherLabelFromDate(date, fallbackDate.baseDate);
    return { city, adm, date, label };
  } catch {
    return {
      city: null,
      adm: undefined,
      date: fallbackDate.date,
      label: fallbackDate.label,
    };
  }
}

function normalizeExtractedWeatherCity(cityText: string): string | null {
  const normalized = cityText
    .trim()
    .replace(/^["'“”]|["'“”]$/g, '')
    .replace(/[，。,.!?！？]/g, '')
    .replace(/^(今天|明天|后天|今晚|今早|明早|昨天|现在|当前)\s*/g, '')
    .replace(/\s*(天气|气温|温度|风速|降雨|下雨)\s*$/g, '')
    .trim();
  const conversationalOnlyPattern =
    /^(我|我们|你|你们|他|她|它)?\s*(想问|问下|问一下|请问|帮我|帮忙|查|查询|查下|查一下|看|看下|看一下|告诉我|告诉下|说下)$/;
  const obviousNonCityPattern =
    /^(我想问|我想知道|请问|帮我查|帮忙查|查一下|看一下|告诉我)$/;
  if (!normalized || /^none$/i.test(normalized)) return null;
  if (conversationalOnlyPattern.test(normalized)) return null;
  if (obviousNonCityPattern.test(normalized)) return null;
  if (/^(昨天|今天|明天|后天|现在|当前)$/.test(normalized)) return null;
  return normalized;
}

function extractWeatherDateByRules(
  userInput: string,
  currentDate: string,
): { date: string; label: string; baseDate: Date } {
  const baseDate = new Date(currentDate);
  if (Number.isNaN(baseDate.getTime())) {
    const now = new Date();
    const date = toIsoDateOnly(now);
    return { date, label: '今天', baseDate: now };
  }
  const text = userInput.trim();
  const lowerText = text.toLowerCase();

  if (/后天/.test(text)) {
    const d = addDays(baseDate, 2);
    return { date: toIsoDateOnly(d), label: '后天', baseDate };
  }
  if (/明天/.test(text)) {
    const d = addDays(baseDate, 1);
    return { date: toIsoDateOnly(d), label: '明天', baseDate };
  }
  if (/(今天|现在|当前|此刻|这会儿)/.test(text)) {
    return { date: toIsoDateOnly(baseDate), label: '今天', baseDate };
  }

  const isoLikeMatch = lowerText.match(
    /\b(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?\b/,
  );
  if (isoLikeMatch) {
    const parsed = buildDateFromParts(
      Number(isoLikeMatch[1]),
      Number(isoLikeMatch[2]),
      Number(isoLikeMatch[3]),
    );
    if (parsed) {
      const date = toIsoDateOnly(parsed);
      return { date, label: date, baseDate };
    }
  }

  const monthDayMatch = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDayMatch) {
    const parsed = buildDateFromParts(
      baseDate.getFullYear(),
      Number(monthDayMatch[1]),
      Number(monthDayMatch[2]),
    );
    if (parsed) {
      const date = toIsoDateOnly(parsed);
      return { date, label: date, baseDate };
    }
  }

  const slashMatch = lowerText.match(/\b(\d{1,2})[/-](\d{1,2})\b/);
  if (slashMatch) {
    const parsed = buildDateFromParts(
      baseDate.getFullYear(),
      Number(slashMatch[1]),
      Number(slashMatch[2]),
    );
    if (parsed) {
      const date = toIsoDateOnly(parsed);
      return { date, label: date, baseDate };
    }
  }

  return { date: toIsoDateOnly(baseDate), label: '今天', baseDate };
}

function normalizeIsoDate(dateStr: string): string | null {
  const text = dateStr.trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const fullMatch = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (!fullMatch) return null;
  const parsed = buildDateFromParts(
    Number(fullMatch[1]),
    Number(fullMatch[2]),
    Number(fullMatch[3]),
  );
  return parsed ? toIsoDateOnly(parsed) : null;
}

function deriveWeatherLabelFromDate(date: string, baseDate: Date): string {
  const target = new Date(`${date}T00:00:00`);
  const base = new Date(baseDate);
  base.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime()))
    return date;
  const diffDays = Math.round((target.getTime() - base.getTime()) / 86400000);
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === 2) return '后天';
  return date;
}

function addDays(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

function toIsoDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildDateFromParts(
  year: number,
  month: number,
  day: number,
): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
