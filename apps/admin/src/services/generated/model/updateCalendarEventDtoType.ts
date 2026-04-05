/**
 * 事件类型
 */
export type UpdateCalendarEventDtoType =
  (typeof UpdateCalendarEventDtoType)[keyof typeof UpdateCalendarEventDtoType];

export const UpdateCalendarEventDtoType = {
  todo: "todo",
  event: "event",
  reminder: "reminder",
} as const;
