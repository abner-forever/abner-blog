/**
 * 事件类型
 */
export type CalendarEventDtoType =
  (typeof CalendarEventDtoType)[keyof typeof CalendarEventDtoType];

export const CalendarEventDtoType = {
  todo: "todo",
  event: "event",
  reminder: "reminder",
} as const;
