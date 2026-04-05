/**
 * 响应类型
 */
export type ChatResponseDtoType =
  (typeof ChatResponseDtoType)[keyof typeof ChatResponseDtoType];

export const ChatResponseDtoType = {
  chat: "chat",
  todo_created: "todo_created",
  event_created: "event_created",
  todo_updated: "todo_updated",
  event_updated: "event_updated",
  todo_deleted: "todo_deleted",
  event_deleted: "event_deleted",
  schedule_query: "schedule_query",
  clarification_needed: "clarification_needed",
  error: "error",
} as const;
