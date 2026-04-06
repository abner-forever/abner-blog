import {
  IsString,
  IsOptional,
  IsNumberString,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentManageQueryDto {
  @ApiPropertyOptional({ description: '页码', type: Number })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: '每页数量', type: Number })
  @IsOptional()
  @IsNumberString()
  size?: string;

  @ApiPropertyOptional({ description: '博客 ID', type: Number })
  @IsOptional()
  @IsNumberString()
  blogId?: string;

  @ApiPropertyOptional({ description: '话题 ID', type: Number })
  @IsOptional()
  @IsNumberString()
  topicId?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class BatchDeleteCommentsDto {
  @ApiProperty({ description: '评论 ID 列表', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}
