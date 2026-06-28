/**
 * OpenAI LLM Provider
 *
 * Uses OpenAI Chat Completions API with JSON mode for structured output.
 */
import OpenAI from 'openai';
import type {
  LLMProvider,
  LLMProviderConfig,
  LLMMessage,
} from './llm-provider.interface';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';

  private createClient(config: LLMProviderConfig): OpenAI {
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
  }

  private getModel(config: LLMProviderConfig): string {
    return config.model || 'gpt-4o';
  }

  async complete(
    messages: LLMMessage[],
    config: LLMProviderConfig,
  ): Promise<string> {
    const client = this.createClient(config);
    const response = await client.chat.completions.create({
      model: this.getModel(config),
      messages,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });
    return response.choices[0]?.message?.content || '';
  }

  async stream(
    messages: LLMMessage[],
    config: LLMProviderConfig,
    onChunk: (text: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const client = this.createClient(config);
    try {
      const stream = await client.chat.completions.create({
        model: this.getModel(config),
        messages,
        temperature: 0.7,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk(delta);
        }
      }
      onDone(fullText);
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
