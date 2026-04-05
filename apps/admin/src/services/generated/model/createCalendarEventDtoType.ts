/**
 * 事件类型
 */
export type CreateCalendarEventDtoType =
  (typeof CreateCalendarEventDtoType)[keyof typeof CreateCalendarEventDtoType];

export const CreateCalendarEventDtoType = {
  todo: "todo",
  event: "event",
  reminder: "reminder",
} as const;
