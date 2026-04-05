import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMomentCommentDto {
  @ApiProperty({ description: '评论内容' })
  @IsString()
  @IsNotEmpty()
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
