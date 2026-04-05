export type ChatRequestDtoProvider =
  (typeof ChatRequestDtoProvider)[keyof typeof ChatRequestDtoProvider];

export const ChatRequestDtoProvider = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
  deepseek: "deepseek",
  qwen: "qwen",
  minimax: "minimax",
} as const;
