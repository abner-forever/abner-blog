import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PageQueryDto {
  @ApiProperty({ required: false, description: '页码', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, description: '每页数量', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiProperty({ required: false, description: '状态筛选' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false, description: '标题搜索关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({
    required: false,
    description: '是否包含已删除 (回收站查询)',
    default: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  withDeleted?: boolean;

  @ApiProperty({ required: false, description: '仅查询已删除 (回收站)' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  deleted?: boolean;

  @ApiProperty({ required: false, description: '语言筛选' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiProperty({
    required: false,
    description: '审批状态筛选 (draft/reviewing/approved/rejected)',
  })
  @IsString()
  @IsOptional()
  reviewStatus?: string;

  @ApiProperty({ required: false, description: '翻译组 ID 筛选' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  translationGroupId?: number;
}
