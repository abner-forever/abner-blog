import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateNoteCommentDto {
  @ApiProperty({ description: '评论内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '父评论ID' })
  @IsNumber()
  @IsOptional()
  parentId?: number;

  @ApiPropertyOptional({ description: '回复用户ID' })
  @IsNumber()
  @IsOptional()
  replyToUserId?: number;
}
