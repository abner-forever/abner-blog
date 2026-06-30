/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/unbound-method */
// Mock environment before imports
process.env.OPENAI_API_KEY = 'test-api-key';

import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { AIConfigService } from './services/ai-config.service';
import { AgentProcessor } from './agent/agent.processor';
import type { AIStreamEvent } from './orchestrator/types';

describe('AIService', () => {
  let service: AIService;
  let mockAIConfigService: jest.Mocked<AIConfigService>;
  let mockAgentProcessor: jest.Mocked<AgentProcessor>;

  beforeEach(async () => {
    mockAIConfigService = {
      resolveModelConfig: jest.fn().mockResolvedValue({
        provider: 'minimax',
        model: 'MiniMax-M2.5',
        apiKey: 'test-key',
        temperature: 7,
        maxTokens: 4096,
      }),
      resolveDefaultConfig: jest.fn().mockResolvedValue({
        provider: 'minimax',
        model: 'MiniMax-M2.5',
        apiKey: 'test-key',
        temperature: 7,
        maxTokens: 4096,
      }),
      getUserConfig: jest.fn().mockResolvedValue({ provider: 'minimax' }),
      saveUserConfig: jest.fn().mockResolvedValue(undefined),
      getConfigTransportPublicKeyDerBase64: jest
        .fn()
        .mockReturnValue('mock-public-key'),
      decryptConfigTransportApiKeys: jest.fn().mockReturnValue({}),
    } as unknown as jest.Mocked<AIConfigService>;

    mockAgentProcessor = {
      processMessageStream: jest.fn(),
    } as unknown as jest.Mocked<AgentProcessor>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: AIConfigService, useValue: mockAIConfigService },
        { provide: AgentProcessor, useValue: mockAgentProcessor },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  describe('processMessageStream', () => {
    it('should delegate to AgentProcessor', async () => {
      const events: AIStreamEvent[] = [
        { event: 'chat_delta', payload: { delta: '你好' } },
        { event: 'chat_delta', payload: { delta: '世界' } },
        { event: 'done', payload: { type: 'chat' } },
      ];
      mockAgentProcessor.processMessageStream.mockReturnValue(
        (async function* () {
          for (const e of events) yield e;
        })(),
      );

      const result: AIStreamEvent[] = [];
      for await (const event of service.processMessageStream(
        '你好',
        1,
        '2026-06-26T00:00:00.000Z',
        'session-1',
        { message: '你好' },
      )) {
        result.push(event);
      }

      expect(mockAgentProcessor.processMessageStream).toHaveBeenCalledWith(
        '你好',
        1,
        expect.any(Object),
        '2026-06-26T00:00:00.000Z',
        'session-1',
        { message: '你好' },
        undefined,
      );
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        event: 'chat_delta',
        payload: { delta: '你好' },
      });
    });

    it('should yield error event on exception', async () => {
      mockAgentProcessor.processMessageStream.mockImplementation(() => {
        throw new Error('LLM connection failed');
      });

      const result: AIStreamEvent[] = [];
      for await (const event of service.processMessageStream('hi', undefined)) {
        result.push(event);
      }

      expect(result[0].event).toBe('error');
    });
  });

  describe('processMessage', () => {
    it('should aggregate stream events into ChatResponseDto', async () => {
      const events: AIStreamEvent[] = [
        { event: 'chat_delta', payload: { delta: 'Hello' } },
        { event: 'chat_delta', payload: { delta: ' World' } },
        { event: 'done', payload: { type: 'chat' } },
      ];
      mockAgentProcessor.processMessageStream.mockReturnValue(
        (async function* () {
          for (const e of events) yield e;
        })(),
      );

      const result = await service.processMessage('hello', 1);

      expect(result.type).toBe('chat');
      expect(result.content).toBe('Hello World');
    });

    it('should return error response on stream error', async () => {
      mockAgentProcessor.processMessageStream.mockReturnValue(
        (async function* () {
          yield { event: 'error', payload: { error: 'something went wrong' } };
        })(),
      );

      const result = await service.processMessage('hello', 1);

      expect(result.type).toBe('error');
      expect(result.error).toBe('something went wrong');
    });

    it('should stop collecting on error event', async () => {
      const events: AIStreamEvent[] = [
        { event: 'chat_delta', payload: { delta: 'partial' } },
        { event: 'error', payload: { error: 'fail' } },
        { event: 'chat_delta', payload: { delta: 'ignored' } },
        { event: 'done', payload: { type: 'chat' } },
      ];
      mockAgentProcessor.processMessageStream.mockReturnValue(
        (async function* () {
          for (const e of events) yield e;
        })(),
      );

      const result = await service.processMessage('hi', 1);

      expect(result.type).toBe('error');
    });
  });

  describe('getUserAIConfig', () => {
    it('should delegate to AIConfigService', async () => {
      await service.getUserAIConfig(1);
      expect(mockAIConfigService.getUserConfig).toHaveBeenCalledWith(1);
    });
  });

  describe('saveUserAIConfig', () => {
    it('should delegate to AIConfigService', async () => {
      await service.saveUserAIConfig(1, {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 7,
        maxTokens: 4096,
      });
      expect(mockAIConfigService.saveUserConfig).toHaveBeenCalled();
    });
  });

  describe('getConfigTransportPublicKey', () => {
    it('should return public key info', () => {
      const result = service.getConfigTransportPublicKey();
      expect(result.algorithm).toBe('RSA-OAEP-256');
      expect(result.publicKeyDerBase64).toBe('mock-public-key');
    });
  });
});
