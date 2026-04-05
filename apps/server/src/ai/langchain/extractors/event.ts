import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  ExtractionResultDto,
  IntentType,
} from '../../dto/extraction-result.dto';
import type { ChatLLM } from '../model';
import { cleanTitle, getTextContent, parseJson } from '../parsers';
import { EVENT_EXTRACTION_PROMPT } from '../prompts';

export async function extractEventEntities(
  llm: ChatLLM,
  userInput: string,
  currentDate: string,
): Promise<ExtractionResultDto | null> {
  const prompt = EVENT_EXTRACTION_PROMPT.replace(
    '{userInput}',
    userInput,
  ).replace('{currentDate}', currentDate);

  try {
    const result = await llm.invoke([
      new SystemMessage('你是一个任务管理助手，只输出JSON。'),
      new HumanMessage(prompt),
    ]);

    const content = getTextContent(result);
    console.log('[AI Event Extraction] Response:', content);

    const parsed = parseJson(content);
    console.log('[AI Event Extraction] Parsed:', parsed);

    if (!parsed || typeof parsed.title !== 'string' || !parsed.title) {
      return extractEventEntitiesByRules(userInput, currentDate);
    }
    if (typeof parsed.startDate !== 'string' || !parsed.startDate) {
      return extractEventEntitiesByRules(userInput, currentDate);
    }

    return {
      intent: IntentType.CREATE_EVENT,
      title: cleanTitle(parsed.title),
      description:
        typeof parsed.description === 'string' ? parsed.description : undefined,
      startDate: parsed.startDate,
      endDate: typeof parsed.endDate === 'string' ? parsed.endDate : undefined,
      location:
        typeof parsed.location === 'string' ? parsed.location : undefined,
      allDay: parsed.allDay === true,
    };
  } catch (error) {
    console.error('Event extraction error:', error);
    return extractEventEntitiesByRules(userInput, currentDate);
  }
}

function extractEventEntitiesByRules(
  userInput: string,
  currentDate: string,
): ExtractionResultDto | null {
  const location = extractLocationFromText(userInput);
  const title = cleanEventTitle(userInput, location);
  const startDate = parseChineseTimeToUtcIso(userInput, currentDate);
  if (!title || !startDate) return null;

  return {
    intent: IntentType.CREATE_EVENT,
    title,
    startDate,
    location: location || undefined,
    allDay: false,
  };
}

function parseChineseTimeToUtcIso(
  text: string,
  currentDate: string,
): string | null {
  const base = new Date(currentDate);
  if (Number.isNaN(base.getTime())) return null;

  const targetDate = resolveTargetBeijingDate(text, base);
  if (!targetDate) return null;

  const parsedTime = parseHourMinute(text);
  if (!parsedTime) return null;
  let { hour } = parsedTime;
  const { minute } = parsedTime;

  const hasAfternoon = /下午|晚上|傍晚/.test(text);
  const hasNoon = /中午/.test(text);
  const hasMorning = /上午|早上|清晨|凌晨/.test(text);

  if (hasAfternoon && hour < 12) hour += 12;
  if (hasNoon && hour < 11) hour += 12;
  if (hasMorning && hour === 12) hour = 0;

  const utcMs =
    targetDate.getTime() -
    8 * 60 * 60 * 1000 +
    (hour * 60 + minute) * 60 * 1000;
  return new Date(utcMs).toISOString();
}

function parseHourMinute(
  text: string,
): { hour: number; minute: number } | null {
  const hourMatch = text.match(
    /(\d{1,2})(?:[:：](\d{1,2}))?\s*(?:点|时)?(半)?/,
  );
  if (!hourMatch) return null;
  const hour = Number(hourMatch[1]);
  const minute = hourMatch[2] ? Number(hourMatch[2]) : hourMatch[3] ? 30 : 0;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return { hour, minute };
}

function resolveTargetBeijingDate(
  text: string,
  baseUtcDate: Date,
): Date | null {
  const beijingBase = new Date(baseUtcDate.getTime() + 8 * 60 * 60 * 1000);
  beijingBase.setUTCHours(0, 0, 0, 0);

  const holidayDate = parseHolidayDate(text, beijingBase.getUTCFullYear());
  if (holidayDate) return holidayDate;

  const nextWeekMatch = text.match(/下周([一二三四五六日天])/);
  if (nextWeekMatch) {
    const weekday = chineseWeekdayToNumber(nextWeekMatch[1]);
    const currentWeekday = beijingBase.getUTCDay();
    const diffToMonday = (1 - currentWeekday + 7) % 7;
    const daysUntilNextMonday = diffToMonday === 0 ? 7 : diffToMonday;
    const result = new Date(beijingBase);
    result.setUTCDate(
      result.getUTCDate() + daysUntilNextMonday + (weekday - 1),
    );
    return result;
  }

  const thisWeekMatch = text.match(/(?:本周|这周|周)([一二三四五六日天])/);
  if (thisWeekMatch) {
    const weekday = chineseWeekdayToNumber(thisWeekMatch[1]);
    const currentWeekday = beijingBase.getUTCDay();
    const diff = weekday - currentWeekday;
    const result = new Date(beijingBase);
    result.setUTCDate(result.getUTCDate() + diff);
    return result;
  }

  const dayOffset = /后天|后上午|后下午|后晚上|后早|后\d|后[:：]/.test(text)
    ? 2
    : /明天|明上午|明下午|明晚上|明早|明\d|明[:：]/.test(text)
      ? 1
      : 0;
  const result = new Date(beijingBase);
  result.setUTCDate(result.getUTCDate() + dayOffset);
  return result;
}

function chineseWeekdayToNumber(ch: string): number {
  const map: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    日: 0,
    天: 0,
  };
  return map[ch] ?? 1;
}

function parseHolidayDate(text: string, year: number): Date | null {
  if (!/清明节|清明/.test(text)) return null;
  const day = year >= 2000 && year <= 2099 ? (year % 4 === 0 ? 4 : 5) : 5;
  const d = new Date(Date.UTC(year, 3, day));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function extractLocationFromText(text: string): string | null {
  const match = text.match(/在([^，。,.]+)/);
  if (!match) return null;
  const location = match[1].trim();
  return location || null;
}

function cleanEventTitle(input: string, location: string | null): string {
  let title = cleanTitle(input);
  if (location) {
    title = title.replace(new RegExp(`在${escapeRegex(location)}`), '').trim();
  } else {
    title = title.replace(/在[^，。,.]+/, '').trim();
  }
  return title.trim() || cleanTitle(input);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
