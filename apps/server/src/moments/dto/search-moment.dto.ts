import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchMomentDto {
  @ApiProperty({ required: false, description: '页码', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: '每页数量',
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({ required: false, description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: '话题 ID 筛选' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topicId?: number;

  @ApiProperty({
    required: false,
    description: '排序方式：time（最新）/ hot（最热）',
    enum: ['time', 'hot'],
    default: 'time',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'time' | 'hot' = 'time';
}
