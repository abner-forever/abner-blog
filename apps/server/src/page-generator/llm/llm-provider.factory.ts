/**
 * LLM Provider Factory
 *
 * Creates the appropriate LLM provider based on the provider name.
 * Lazy-initializes providers on first use.
 */
import type { LLMProvider } from './llm-provider.interface';
import { DeepSeekProvider } from './deepseek.provider';
import { OpenAIProvider } from './openai.provider';
import { ClaudeProvider } from './claude.provider';

const providers = new Map<string, LLMProvider>();

export function getLLMProvider(providerName: string): LLMProvider {
  const existing = providers.get(providerName);
  if (existing) return existing;

  let provider: LLMProvider;
  switch (providerName) {
    case 'deepseek':
      provider = new DeepSeekProvider();
      break;
    case 'openai':
      provider = new OpenAIProvider();
      break;
    case 'anthropic':
      provider = new ClaudeProvider();
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${providerName}`);
  }

  providers.set(providerName, provider);
  return provider;
}
