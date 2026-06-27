import { AIMessage } from '@langchain/core/messages';
import {
  cleanTitle,
  extractEventEntities,
  extractTodoEntities,
} from './chains';
import { IntentType } from '../dto/extraction-result.dto';

// Mock the LLM
jest.mock('./model', () => ({
  SimpleMiniMaxLLM: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
}));

describe('cleanTitle', () => {
  it('should remove time prefix like "9-"', () => {
    expect(cleanTitle('9-复习面试')).toBe('复习面试');
  });

  it('should remove time prefix like "9到"', () => {
    expect(cleanTitle('9到复习面试')).toBe('复习面试');
  });

  it('should remove date prefix like "明"', () => {
    expect(cleanTitle('明上午开会')).toBe('开会');
  });

  it('should remove full time expression', () => {
    expect(cleanTitle('明天上午9点复习面试')).toBe('复习面试');
  });

  it('should return original title if nothing to clean', () => {
    expect(cleanTitle('买牛奶')).toBe('买牛奶');
  });

  it('should handle empty string', () => {
    expect(cleanTitle('')).toBe('');
  });

  it('should remove trailing todo command words', async () => {
    const llm = {
      invoke: jest
        .fn()
        .mockResolvedValue(new AIMessage({ content: 'invalid' })),
    } as unknown as {
      invoke: jest.Mock;
    };
    const result = await extractTodoEntities(
      llm as never,
      '完善聊天功能 记一下',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_TODO,
      title: '完善聊天功能',
    });
  });
});

describe('IntentType enum', () => {
  it('should have correct values', () => {
    expect(IntentType.CREATE_TODO).toBe('create_todo');
    expect(IntentType.CREATE_EVENT).toBe('create_event');
    expect(IntentType.UPDATE_TODO).toBe('update_todo');
    expect(IntentType.UPDATE_EVENT).toBe('update_event');
    expect(IntentType.DELETE_TODO).toBe('delete_todo');
    expect(IntentType.DELETE_EVENT).toBe('delete_event');
    expect(IntentType.QUERY_SCHEDULE).toBe('query_schedule');
    expect(IntentType.QUERY_WEATHER).toBe('query_weather');
    expect(IntentType.CHAT).toBe('chat');
  });
});

describe('extractEventEntities', () => {
  const createMockLlm = (content: string) =>
    ({
      invoke: jest.fn().mockResolvedValue(new AIMessage({ content })),
    }) as unknown as {
      invoke: jest.Mock;
    };

  it('should fallback to rule extraction when llm output is invalid json', async () => {
    const llm = createMockLlm('我不太确定');
    const result = await extractEventEntities(
      llm as never,
      '明上午9点开会',
      '2026-03-26T00:00:00.000Z',
    );

    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '开会',
      startDate: '2026-03-27T01:00:00.000Z',
    });
  });

  it('should extract half-hour time and location in fallback mode', async () => {
    const llm = createMockLlm('不是json');
    const result = await extractEventEntities(
      llm as never,
      '明上午9点半开会在中关村会议室',
      '2026-03-26T00:00:00.000Z',
    );

    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '开会',
      location: '中关村会议室',
      startDate: '2026-03-27T01:30:00.000Z',
    });
  });

  it('should parse tomorrow afternoon colloquial time', async () => {
    const llm = createMockLlm('invalid');
    const result = await extractEventEntities(
      llm as never,
      '明天下午3点开会',
      '2026-03-26T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '开会',
      startDate: '2026-03-27T07:00:00.000Z',
    });
  });

  it('should parse next monday colloquial time', async () => {
    const llm = createMockLlm('invalid');
    const result = await extractEventEntities(
      llm as never,
      '下周一上午9点例会',
      '2026-03-26T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '例会',
      startDate: '2026-03-30T01:00:00.000Z',
    });
  });

  it('should parse qingming festival time', async () => {
    const llm = createMockLlm('invalid');
    const result = await extractEventEntities(
      llm as never,
      '清明节上午10点扫墓',
      '2026-03-26T00:00:00.000Z',
    );
    expect(result).toMatchObject({
      intent: IntentType.CREATE_EVENT,
      title: '扫墓',
      startDate: '2026-04-05T02:00:00.000Z',
    });
  });
});

describe('extractTodoEntities', () => {
  const createMockLlm = (content: string) =>
    ({
      invoke: jest.fn().mockResolvedValue(new AIMessage({ content })),
    }) as unknown as {
      invoke: jest.Mock;
    };

  it('should fallback todo extraction when llm output is invalid', async () => {
    const llm = createMockLlm('无法解析');
    const result = await extractTodoEntities(llm as never, '记一下买牛奶');
    expect(result).toMatchObject({
      intent: IntentType.CREATE_TODO,
      title: '买牛奶',
    });
  });
});
