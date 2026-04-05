import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { LLMProvider } from '../langchain/model';

const CHAT_IMAGE_MIMES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
] as const;

export class ChatImageDto {
  @ApiProperty({
    enum: CHAT_IMAGE_MIMES,
    description: '图片 MIME 类型',
  })
  @IsIn([...CHAT_IMAGE_MIMES])
  mimeType: string;

  @ApiProperty({
    description: 'Base64 编码的图片数据（不含 data: 前缀）',
    maxLength: 6_000_000,
  })
  @IsString()
  @MaxLength(6_000_000)
  dataBase64: string;
}

export class SaveAIConfigDto {
  @ApiProperty({
    enum: ['openai', 'anthropic', 'gemini', 'deepseek', 'qwen', 'minimax'],
  })
  @IsIn(['openai', 'anthropic', 'gemini', 'deepseek', 'qwen', 'minimax'])
  provider: LLMProvider;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32768)
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  contextWindow?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  thinkingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(32000)
  thinkingBudget?: number;

  @ApiPropertyOptional({
    description: '按 provider 存储 apiKey，例如 {"openai":"sk-xxx"}',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  apiKeys?: Record<string, string>;

  @ApiPropertyOptional({
    description:
      '按 provider 存储经过公钥加密的 apiKey（base64），例如 {"openai":"..."}',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  encryptedApiKeys?: Record<string, string>;
}

export class ChatRequestDto {
  @ApiProperty({ description: '用户消息' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: '会话 ID，用于关联多轮聊天上下文' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: '当前日期（ISO 格式）' })
  @IsOptional()
  @IsString()
  currentDate?: string;

  @ApiPropertyOptional({
    enum: ['openai', 'anthropic', 'gemini', 'deepseek', 'qwen', 'minimax'],
  })
  @IsOptional()
  @IsIn(['openai', 'anthropic', 'gemini', 'deepseek', 'qwen', 'minimax'])
  provider?: LLMProvider;

  @ApiPropertyOptional({ description: '模型名称' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32768)
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  contextWindow?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  thinkingEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(32000)
  thinkingBudget?: number;

  @ApiPropertyOptional({
    description: '随消息附带的图片（用于视觉理解），最多 4 张',
    type: [ChatImageDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ChatImageDto)
  images?: ChatImageDto[];
}
