import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ required: false, description: '评论内容' })
  @IsString()
  @IsOptional()
  content?: string;
}
