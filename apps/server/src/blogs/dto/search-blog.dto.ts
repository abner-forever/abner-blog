import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchBlogDto {
  @ApiProperty({ required: false, description: '页码', minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    description: '每页数量',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;

  @ApiProperty({ required: false, description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: '标签筛选' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({ required: false, description: '是否只看自己的博客' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAuthor?: boolean;

  @ApiProperty({
    required: false,
    description: '排序方式',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    required: false,
    description: '按作者 ID 筛选（只返回已发布）',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  authorId?: number;
}
