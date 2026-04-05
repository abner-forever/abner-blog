import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  createPrivateKey,
  createPublicKey,
  createCipheriv,
  createDecipheriv,
  createHash,
  generateKeyPairSync,
  privateDecrypt,
  constants,
  randomBytes,
} from 'node:crypto';
import { UserAIConfig } from '../../entities/user-ai-config.entity';
import type { LLMProvider, ChatModelConfig } from '../langchain/model';

export interface UserAIConfigInput {
  provider: LLMProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  thinkingEnabled: boolean;
  thinkingBudget: number;
  apiKeys?: Partial<Record<LLMProvider, string>>;
}

export interface UserAIConfigView extends UserAIConfigInput {
  hasApiKeyByProvider: Partial<Record<LLMProvider, boolean>>;
}

@Injectable()
export class AIConfigService {
  private readonly configTransportPrivateKey =
    this.buildConfigTransportPrivateKey();
  private readonly configTransportPublicKeyDerBase64 =
    this.buildConfigTransportPublicKeyDerBase64();

  constructor(
    @InjectRepository(UserAIConfig)
    private readonly userAIConfigRepository: Repository<UserAIConfig>,
  ) {}

  async getUserConfig(userId: number): Promise<UserAIConfigView> {
    const entity = await this.userAIConfigRepository.findOne({
      where: { userId },
    });
    if (!entity) return this.getDefaultConfig();
    const apiKeys = this.decryptApiKeys(entity.encryptedApiKeys);
    return {
      provider: entity.provider as LLMProvider,
      model: entity.model,
      temperature: entity.temperature,
      maxTokens: entity.maxTokens,
      contextWindow: entity.contextWindow,
      thinkingEnabled: entity.thinkingEnabled,
      thinkingBudget: entity.thinkingBudget,
      hasApiKeyByProvider: this.buildHasApiKeyMap(apiKeys),
    };
  }

  async saveUserConfig(
    userId: number,
    input: UserAIConfigInput,
  ): Promise<UserAIConfigView> {
    const existing = await this.userAIConfigRepository.findOne({
      where: { userId },
    });
    const mergedApiKeys = {
      ...(existing ? this.decryptApiKeys(existing.encryptedApiKeys) : {}),
      ...(input.apiKeys || {}),
    };
    const entity = this.userAIConfigRepository.create({
      id: existing?.id,
      userId,
      provider: input.provider,
      model: input.model,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      contextWindow: input.contextWindow,
      thinkingEnabled: input.thinkingEnabled,
      thinkingBudget: input.thinkingBudget,
      encryptedApiKeys: this.encryptApiKeys(mergedApiKeys),
    });
    const saved = await this.userAIConfigRepository.save(entity);
    return {
      provider: saved.provider as LLMProvider,
      model: saved.model,
      temperature: saved.temperature,
      maxTokens: saved.maxTokens,
      contextWindow: saved.contextWindow,
      thinkingEnabled: saved.thinkingEnabled,
      thinkingBudget: saved.thinkingBudget,
      hasApiKeyByProvider: this.buildHasApiKeyMap(mergedApiKeys),
    };
  }

  getConfigTransportPublicKeyDerBase64(): string {
    return this.configTransportPublicKeyDerBase64;
  }

  decryptConfigTransportApiKeys(
    encryptedApiKeys?: Partial<Record<LLMProvider, string>>,
  ): Partial<Record<LLMProvider, string>> {
    if (!encryptedApiKeys) return {};
    const out: Partial<Record<LLMProvider, string>> = {};
    const providers = Object.keys(encryptedApiKeys) as LLMProvider[];
    for (const provider of providers) {
      const cipherTextBase64 = encryptedApiKeys[provider];
      if (!cipherTextBase64) continue;
      try {
        const plain = privateDecrypt(
          {
            key: this.configTransportPrivateKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
          },
          Buffer.from(cipherTextBase64, 'base64'),
        ).toString('utf8');
        out[provider] = plain;
      } catch {
        // ignore invalid encrypted payload for this provider
      }
    }
    return out;
  }

  async resolveModelConfig(
    userId: number,
    runtime: Partial<UserAIConfigInput> & { apiKey?: string },
  ): Promise<ChatModelConfig> {
    const stored = await this.getUserConfig(userId);
    const entity = await this.userAIConfigRepository.findOne({
      where: { userId },
    });
    const storedKeys = this.decryptApiKeys(entity?.encryptedApiKeys || null);
    const provider = runtime.provider ?? stored.provider;
    const rawRuntime = runtime.apiKey
      ? this.normalizeLlmSecretKey(runtime.apiKey)
      : '';
    const rawStored = storedKeys[provider]
      ? this.normalizeLlmSecretKey(String(storedKeys[provider]))
      : '';
    const apiKey = rawRuntime || rawStored;
    if (!apiKey) {
      throw new Error(`Missing apiKey for provider: ${provider}`);
    }
    return {
      provider,
      model: runtime.model ?? stored.model,
      apiKey,
      temperature: runtime.temperature ?? stored.temperature,
      maxTokens: runtime.maxTokens ?? stored.maxTokens,
      thinkingEnabled: runtime.thinkingEnabled ?? stored.thinkingEnabled,
      thinkingBudget: runtime.thinkingBudget ?? stored.thinkingBudget,
    };
  }

  /** 去掉首尾空白、重复 Bearer、包裹引号，避免鉴权失败 */
  private normalizeLlmSecretKey(raw: string): string {
    let k = raw.trim();
    if (k.toLowerCase().startsWith('bearer ')) {
      k = k.slice(7).trim();
    }
    if (
      (k.startsWith('"') && k.endsWith('"')) ||
      (k.startsWith("'") && k.endsWith("'"))
    ) {
      k = k.slice(1, -1).trim();
    }
    return k;
  }

  private getDefaultConfig(): UserAIConfigView {
    return {
      provider: 'minimax',
      model: 'MiniMax-M2.7',
      temperature: 7,
      maxTokens: 4096,
      contextWindow: 10,
      thinkingEnabled: false,
      thinkingBudget: 0,
      hasApiKeyByProvider: {},
    };
  }

  private buildHasApiKeyMap(
    keys: Partial<Record<LLMProvider, string>>,
  ): Partial<Record<LLMProvider, boolean>> {
    const out: Partial<Record<LLMProvider, boolean>> = {};
    const providers = Object.keys(keys) as LLMProvider[];
    for (const provider of providers) {
      out[provider] = Boolean((keys[provider] || '').trim());
    }
    return out;
  }

  private encryptApiKeys(keys: Partial<Record<LLMProvider, string>>): string {
    const plaintext = JSON.stringify(keys);
    const key = this.buildEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptApiKeys(
    payload: string | null,
  ): Partial<Record<LLMProvider, string>> {
    if (!payload) return {};
    try {
      const [ivBase64, tagBase64, encryptedBase64] = payload.split('.');
      if (!ivBase64 || !tagBase64 || !encryptedBase64) return {};
      const key = this.buildEncryptionKey();
      const decipher = createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(ivBase64, 'base64'),
      );
      decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final(),
      ]);
      return JSON.parse(decrypted.toString('utf8')) as Partial<
        Record<LLMProvider, string>
      >;
    } catch {
      return {};
    }
  }

  private buildEncryptionKey(): Buffer {
    const secret =
      process.env.AI_CONFIG_ENCRYPTION_KEY || 'default-ai-config-key';
    return createHash('sha256').update(secret).digest();
  }

  private buildConfigTransportPrivateKey(): string {
    const pem = process.env.AI_CONFIG_TRANSPORT_PRIVATE_KEY?.trim();
    if (pem) return pem.replace(/\\n/g, '\n').trim();
    return generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey;
  }

  private buildConfigTransportPublicKeyDerBase64(): string {
    const publicKeyDer = createPublicKey(
      createPrivateKey(this.configTransportPrivateKey),
    ).export({
      type: 'spki',
      format: 'der',
    });
    return Buffer.from(publicKeyDer).toString('base64');
  }
}
