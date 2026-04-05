/**
 * 意图类型
 */
export type ClarificationNeededDtoIntent =
  (typeof ClarificationNeededDtoIntent)[keyof typeof ClarificationNeededDtoIntent];

export const ClarificationNeededDtoIntent = {
  create_todo: "create_todo",
  create_event: "create_event",
  update_todo: "update_todo",
  update_event: "update_event",
  delete_todo: "delete_todo",
  delete_event: "delete_event",
  query_schedule: "query_schedule",
  query_weather: "query_weather",
  web_search: "web_search",
  chat: "chat",
} as const;
