export type SaveAIConfigDtoProvider =
  (typeof SaveAIConfigDtoProvider)[keyof typeof SaveAIConfigDtoProvider];

export const SaveAIConfigDtoProvider = {
  openai: "openai",
  anthropic: "anthropic",
  gemini: "gemini",
  deepseek: "deepseek",
  qwen: "qwen",
  minimax: "minimax",
} as const;
