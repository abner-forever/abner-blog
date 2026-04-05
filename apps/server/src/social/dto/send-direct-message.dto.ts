import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendDirectMessageDto {
  @ApiProperty({ description: '文本内容', maxLength: 8000 })
  @IsString()
  @MaxLength(8000)
  content: string;

  @ApiPropertyOptional({
    description: '附件图片 URL 列表',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
