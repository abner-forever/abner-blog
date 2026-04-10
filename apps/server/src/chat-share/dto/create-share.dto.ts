import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateShareDto {
  @ApiProperty({ description: '原始会话ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: '会话标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '消息列表', type: [Object] })
  @IsArray()
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export class ShareSessionResponseDto {
  @ApiProperty({ description: '分享ID' })
  id: string;

  @ApiProperty({ description: '会话标题' })
  title: string;

  @ApiProperty({ description: '消息列表' })
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;

  @ApiProperty({ description: '是否有效' })
  isActive: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '过期时间', required: false })
  expiresAt?: Date;
}
