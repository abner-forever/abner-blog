import { IsString, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatSessionMessageDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  displayContent?: string;

  @ApiPropertyOptional()
  thinkingContent?: string;

  @ApiPropertyOptional()
  timestamp?: number;

  @ApiPropertyOptional()
  isComplete?: boolean;
}

export class SaveSessionDto {
  @ApiProperty({ description: '客户端生成的会话 ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: '会话标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '消息列表' })
  @IsArray()
  @IsObject({ each: true })
  messages: Record<string, unknown>[];

  @ApiProperty({ description: '使用的模型' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ description: '时间戳' })
  @IsOptional()
  @IsNumber()
  timestamp?: number;
}

export class DeleteSessionDto {
  @ApiProperty({ description: '会话 ID' })
  @IsString()
  sessionId: string;
}

export class SessionListItemDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  model: string;

  @ApiProperty()
  messageCount: number;
}
