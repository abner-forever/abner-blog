/**
 * 按 provider 存储经过公钥加密的 apiKey（base64），例如 {"openai":"..."}
 */
export type SaveAIConfigDtoEncryptedApiKeys = { [key: string]: unknown };
