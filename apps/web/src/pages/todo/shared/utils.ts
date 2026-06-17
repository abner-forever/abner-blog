import dayjs, { type Dayjs } from 'dayjs';
import type { CalendarType } from '@schedule-x/calendar';

export interface CalendarEventData {
  id?: string;
  title: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
  completed?: boolean;
  type?: string;
  description?: string;
  allDay?: boolean;
}

export const colorOptions = [
  { value: '#8b5cf6', label: '紫色', calendarId: 'purple' },
  { value: '#3b82f6', label: '蓝色', calendarId: 'blue' },
  { value: '#10b981', label: '绿色', calendarId: 'green' },
  { value: '#f59e0b', label: '橙色', calendarId: 'orange' },
  { value: '#ef4444', label: '红色', calendarId: 'red' },
  { value: '#ec4899', label: '粉色', calendarId: 'pink' },
  { value: '#06b6d4', label: '青色', calendarId: 'cyan' },
  { value: '#6366f1', label: '靛蓝', calendarId: 'indigo' },
];

/** 颜色 hex → calendarId 映射 */
const colorToCalendarId: Record<string, string> = Object.fromEntries(
  colorOptions.map((c) => [c.value, c.calendarId]),
);

/** schedule-x 日历类型颜色定义（用于 calendars 配置） */
export const calendarTypes: Record<string, CalendarType> = {
  purple: {
    colorName: 'purple',
    lightColors: { main: '#8b5cf6', container: '#ede9fe', onContainer: '#5b21b6' },
    darkColors: { main: '#a78bfa', container: '#2e1065', onContainer: '#ddd6fe' },
  },
  blue: {
    colorName: 'blue',
    lightColors: { main: '#3b82f6', container: '#dbeafe', onContainer: '#1e40af' },
    darkColors: { main: '#60a5fa', container: '#172554', onContainer: '#bfdbfe' },
  },
  green: {
    colorName: 'green',
    lightColors: { main: '#10b981', container: '#d1fae5', onContainer: '#065f46' },
    darkColors: { main: '#34d399', container: '#022c22', onContainer: '#a7f3d0' },
  },
  orange: {
    colorName: 'orange',
    lightColors: { main: '#f59e0b', container: '#fef3c7', onContainer: '#92400e' },
    darkColors: { main: '#fbbf24', container: '#451a03', onContainer: '#fde68a' },
  },
  red: {
    colorName: 'red',
    lightColors: { main: '#ef4444', container: '#fee2e2', onContainer: '#991b1b' },
    darkColors: { main: '#f87171', container: '#450a0a', onContainer: '#fecaca' },
  },
  pink: {
    colorName: 'pink',
    lightColors: { main: '#ec4899', container: '#fce7f3', onContainer: '#9d174d' },
    darkColors: { main: '#f472b6', container: '#500724', onContainer: '#fbcfe8' },
  },
  cyan: {
    colorName: 'cyan',
    lightColors: { main: '#06b6d4', container: '#cffafe', onContainer: '#155e75' },
    darkColors: { main: '#22d3ee', container: '#083344', onContainer: '#a5f3fc' },
  },
  indigo: {
    colorName: 'indigo',
    lightColors: { main: '#6366f1', container: '#e0e7ff', onContainer: '#3730a3' },
    darkColors: { main: '#818cf8', container: '#1e1b4b', onContainer: '#c7d2fe' },
  },
};

export const parseCalendarDate = (value?: string): Dayjs => {
  if (!value) return dayjs('');
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return dayjs(datePart);
  }
  return dayjs(value);
};

/** 判断日期字符串是否包含时间信息 */
const hasTimeInfo = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return dateStr.includes('T') || dateStr.includes(':');
};

/** 将 dayjs 转换为 Temporal.ZonedDateTime */
export const dayjsToTemporal = (date: Dayjs): Temporal.ZonedDateTime => {
  const iso = date.format('YYYY-MM-DDTHH:mm:ss');
  return Temporal.ZonedDateTime.from(
    `${iso}[${Intl.DateTimeFormat().resolvedOptions().timeZone}]`,
  );
};

/** 将 Temporal.ZonedDateTime 转为 dayjs */
export const temporalZonedToDayjs = (date: Temporal.ZonedDateTime): Dayjs => {
  return dayjs(
    `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}T${String(date.hour).padStart(2, '0')}:${String(date.minute).padStart(2, '0')}:${String(date.second).padStart(2, '0')}`,
  );
};

/** 将 Temporal.PlainDate 转为 dayjs 用于侧边面板的日期格式化 */
export const temporalToDayjs = (date: Temporal.PlainDate): Dayjs => {
  return dayjs(
    `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
  );
};

/** 将后端 CalendarEventDto 转换为 schedule-x 事件格式 */
export const toScheduleXEvent = (event: CalendarEventData) => {
  const isTimed = !event.allDay && (hasTimeInfo(event.startDate) || hasTimeInfo(event.endDate));

  let start: Temporal.PlainDate | Temporal.ZonedDateTime;
  let end: Temporal.PlainDate | Temporal.ZonedDateTime;

  if (isTimed) {
    // 有时间信息：使用 ZonedDateTime
    const startDate = event.startDate || '';
    const endDate = event.endDate || event.startDate || '';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (hasTimeInfo(startDate)) {
      const d = dayjs(startDate);
      start = Temporal.ZonedDateTime.from(
        `${d.format('YYYY-MM-DDTHH:mm:ss')}[${timezone}]`,
      );
    } else {
      start = Temporal.PlainDate.from(startDate.slice(0, 10));
    }

    if (hasTimeInfo(endDate)) {
      const d = dayjs(endDate);
      end = Temporal.ZonedDateTime.from(
        `${d.format('YYYY-MM-DDTHH:mm:ss')}[${timezone}]`,
      );
    } else {
      end = Temporal.PlainDate.from(endDate.slice(0, 10));
    }
  } else {
    // 全天事件：使用 PlainDate
    const startDate = (event.startDate || '').slice(0, 10);
    const endDate = (event.endDate || event.startDate || '').slice(0, 10);
    start = Temporal.PlainDate.from(startDate);
    end = Temporal.PlainDate.from(endDate);
  }

  return {
    id: event.id || `temp-${Date.now()}`,
    title: event.title || '',
    start,
    end,
    description: event.description || '',
    calendarId: colorToCalendarId[event.color || '#8b5cf6'] || 'purple',
    _backendId: event.id,
    _completed: event.completed,
    _allDay: event.allDay ?? true,
  };
};

/** 将日期格式化为 ISO 字符串（根据是否全天决定是否带时间） */
export const formatDateForBackend = (
  date: Dayjs,
  allDay: boolean,
): string => {
  if (allDay) {
    return date.format('YYYY-MM-DD');
  }
  return date.toISOString();
};
