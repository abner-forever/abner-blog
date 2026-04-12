import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IntentType {
  CREATE_TODO = 'create_todo',
  CREATE_EVENT = 'create_event',
  UPDATE_TODO = 'update_todo',
  UPDATE_EVENT = 'update_event',
  DELETE_TODO = 'delete_todo',
  DELETE_EVENT = 'delete_event',
  QUERY_SCHEDULE = 'query_schedule',
  QUERY_WEATHER = 'query_weather',
  CHAT = 'chat',
}

export class ExtractionResultDto {
  @ApiProperty({ description: '意图类型' })
  intent: IntentType;

  @ApiPropertyOptional({ description: '提取的标题' })
  title?: string;

  @ApiPropertyOptional({ description: '提取的描述' })
  description?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  endDate?: string;

  @ApiPropertyOptional({ description: '是否全天事件' })
  allDay?: boolean;

  @ApiPropertyOptional({ description: '地点' })
  location?: string;

  @ApiPropertyOptional({ description: '是否完成' })
  completed?: boolean;
}

export class ClarificationNeededDto {
  @ApiProperty({ description: '意图类型' })
  intent: IntentType;

  @ApiProperty({ description: '缺失的字段列表' })
  missingFields: string[];

  @ApiProperty({ description: '已提取的部分数据' })
  partialData: Partial<ExtractionResultDto>;

  @ApiProperty({ description: '补充信息的建议' })
  suggestion: string;
}

export class ScheduleAnalysisDto {
  @ApiProperty({ description: '完成率 0-100' })
  completionRate: number;

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '已完成数' })
  completed: number;

  @ApiProperty({ description: '未完成数' })
  pending: number;

  @ApiProperty({ description: '过期未完成数' })
  overdueCount: number;

  @ApiProperty({ description: '分布情况' })
  distribution: '均匀' | '集中' | '稀疏';

  @ApiProperty({ description: '优先处理项' })
  priorityItems: string[];

  @ApiProperty({ description: '一句话总结' })
  summary: string;

  @ApiProperty({ description: '建议' })
  suggestion: string;
}

export class ChatResponseDto {
  @ApiProperty({
    description: '响应类型',
    enum: [
      'chat',
      'todo_created',
      'event_created',
      'todo_updated',
      'event_updated',
      'todo_deleted',
      'event_deleted',
      'schedule_query',
      'clarification_needed',
      'error',
    ],
  })
  type: string;

  @ApiPropertyOptional({ description: '聊天内容（type=chat 时）' })
  content?: string;

  @ApiPropertyOptional({
    description: '创建的数据（type=todo_created/event_created 时）',
  })
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '日程列表（type=schedule_query 时）' })
  scheduleData?: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: '日程分析结果（type=schedule_query 时）',
  })
  scheduleAnalysis?: ScheduleAnalysisDto;

  @ApiPropertyOptional({
    description: '需要补充的信息（type=clarification_needed 时）',
  })
  clarification?: ClarificationNeededDto;

  @ApiPropertyOptional({ description: '错误信息（type=error 时）' })
  error?: string;
}
