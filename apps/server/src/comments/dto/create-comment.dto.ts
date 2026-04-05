import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: '评论内容（最多1000字）' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: '评论内容不能超过1000字' })
  content: string;

  @ApiProperty({ required: false, description: '父评论 ID（回复时使用）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiProperty({ required: false, description: '被回复用户 ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  replyToUserId?: number;
}
