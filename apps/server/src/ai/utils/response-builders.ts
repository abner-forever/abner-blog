import {
  ChatResponseDto,
  ExtractionResultDto,
  IntentType,
} from '../dto/extraction-result.dto';

export function buildClarificationResponse(params: {
  intent: IntentType;
  missingFields: string[];
  partialData?: Partial<ExtractionResultDto>;
  suggestion: string;
}): ChatResponseDto {
  const { intent, missingFields, partialData = {}, suggestion } = params;
  return {
    type: 'clarification_needed',
    clarification: {
      intent,
      missingFields,
      partialData,
      suggestion,
    },
  };
}

export function buildScheduleSummary(
  scheduleData?: Record<string, unknown>[],
): string {
  if (!scheduleData || scheduleData.length === 0) {
    return '已查询日程：当前没有待办或日程安排。';
  }
  const eventCount = scheduleData.filter(
    (item) => item.type === 'event',
  ).length;
  const todoCount = scheduleData.filter((item) => item.type === 'todo').length;
  return `已查询日程：共${eventCount}条日程，${todoCount}条待办。`;
}
