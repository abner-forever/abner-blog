import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum ViewType {
  PV = 'pv',
  UV = 'uv',
  ALL = 'all',
}

export class DailyViewItemDto {
  @ApiProperty({ description: '日期，格式 YYYY-MM-DD', example: '2026-03-23' })
  date: string;

  @ApiPropertyOptional({ description: 'PV（页面浏览量）', example: 100 })
  @IsOptional()
  pv?: number;

  @ApiPropertyOptional({ description: 'UV（独立访客）', example: 50 })
  @IsOptional()
  uv?: number;

  @ApiPropertyOptional({
    description: '访问量（当 type=pv 或 type=uv 时返回此字段）',
    example: 100,
  })
  @IsOptional()
  views?: number;
}

export class GetDailyViewsQueryDto {
  @ApiPropertyOptional({
    enum: ViewType,
    default: ViewType.ALL,
    description: '访问类型：pv=页面浏览量, uv=独立访客, all=全部',
  })
  @IsOptional()
  @IsEnum(ViewType)
  type?: ViewType;
}
