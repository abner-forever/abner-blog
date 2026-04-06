import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class TopicManageQueryDto {
  @ApiPropertyOptional({ description: '页码', type: Number })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', type: Number })
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsNumber()
  size?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;
}

export class AdminCreateTopicDto {
  @ApiProperty({ description: '话题名称' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '话题描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '封面图片 URL' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ description: '是否热门', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;
}

export class UpdateTopicDto {
  @ApiPropertyOptional({ description: '话题名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '话题描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '封面图片 URL' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiPropertyOptional({ description: '是否热门', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;
}
