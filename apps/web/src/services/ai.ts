export interface ChatStreamImagePart {
  mimeType: string;
  dataBase64: string;
}

interface ChatStreamRequest {
  message: string;
  currentDate: string;
  sessionId?: string;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen' | 'minimax';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  contextWindow?: number;
  thinkingEnabled?: boolean;
  thinkingBudget?: number;
  useMcpTools?: boolean;
  /** 随消息上传的图片（Base64，与后端 ChatImageDto 一致） */
  images?: ChatStreamImagePart[];
  signal?: AbortSignal;
}

interface AIConfigTransportPublicKeyResponse {
  algorithm: 'RSA-OAEP-256';
  publicKeyDerBase64: string;
}

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  timestamp?: string;
}

const getChatStreamHeaders = async (): Promise<Record<string, string>> => {
  const token = localStorage.getItem('user-token');
  const apiEnv = window.AbnerEnvTool && (await window.AbnerEnvTool.getEnv());

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiEnv ? { 'api-env': apiEnv } : {}),
  };
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer.slice(0);
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

let cachedConfigTransportPublicKey: Promise<CryptoKey> | null = null;

const getConfigTransportPublicKey = async (): Promise<CryptoKey> => {
  if (cachedConfigTransportPublicKey) return cachedConfigTransportPublicKey;
  cachedConfigTransportPublicKey = (async () => {
    const headers = await getChatStreamHeaders();
    const response = await fetch('/api/ai/config/public-key', {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(`获取配置加密公钥失败(${response.status})`);
    }
    const raw = (await response.json()) as
      | AIConfigTransportPublicKeyResponse
      | ApiEnvelope<AIConfigTransportPublicKeyResponse>;
    const data =
      (raw as ApiEnvelope<AIConfigTransportPublicKeyResponse>)?.data ||
      (raw as AIConfigTransportPublicKeyResponse);
    if (!data?.publicKeyDerBase64) {
      throw new Error('配置加密公钥为空');
    }
    return window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(data.publicKeyDerBase64),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt'],
    );
  })();
  return cachedConfigTransportPublicKey;
};

const encryptApiKeysForConfig = async (
  apiKeys: Record<string, string>,
): Promise<Record<string, string>> => {
  const providers = Object.keys(apiKeys);
  if (!providers.length) return {};
  const key = await getConfigTransportPublicKey();
  const encoder = new TextEncoder();
  const encryptedEntries = await Promise.all(
    providers.map(async (provider) => {
      const raw = (apiKeys[provider] || '').trim();
      if (!raw) return [provider, ''] as const;
      const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        key,
        encoder.encode(raw),
      );
      return [provider, bytesToBase64(new Uint8Array(cipherBuffer))] as const;
    }),
  );
  return Object.fromEntries(encryptedEntries.filter(([, v]) => Boolean(v)));
};

export const requestAIChatStream = async ({
  message,
  currentDate,
  sessionId,
  provider,
  model,
  temperature,
  maxTokens,
  contextWindow,
  thinkingEnabled,
  thinkingBudget,
  useMcpTools,
  images,
  signal,
}: ChatStreamRequest): Promise<Response> => {
  const headers = await getChatStreamHeaders();
  const response = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers,
    // message、images 靠前：若链路对 body 长度有截断，优先保留多模态关键字段
    body: JSON.stringify({
      message,
      images,
      currentDate,
      sessionId,
      provider,
      model,
      temperature,
      maxTokens,
      contextWindow,
      thinkingEnabled,
      thinkingBudget,
      useMcpTools,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`请求失败(${response.status})`);
  }

  return response;
};

export interface SaveAIConfigRequest {
  provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'qwen' | 'minimax';
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  thinkingEnabled: boolean;
  thinkingBudget: number;
  useMcpTools?: boolean;
  apiKeys: Record<string, string>;
}

export const saveAIConfig = async (payload: SaveAIConfigRequest) => {
  const headers = await getChatStreamHeaders();
  const encryptedApiKeys = await encryptApiKeysForConfig(payload.apiKeys || {});
  const response = await fetch('/api/ai/config', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...payload,
      encryptedApiKeys,
    }),
  });
  if (!response.ok) {
    throw new Error(`保存配置失败(${response.status})`);
  }
  return response.json();
};

export const getAIConfig = async () => {
  const headers = await getChatStreamHeaders();
  const response = await fetch('/api/ai/config/get', {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    throw new Error(`加载配置失败(${response.status})`);
  }
  return response.json();
};
