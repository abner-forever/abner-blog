import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PerformanceMetricDto {
  @ApiPropertyOptional({ description: '最大内容绘制 (ms)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lcp?: number;

  @ApiPropertyOptional({ description: '首次输入延迟 (ms)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fid?: number;

  @ApiPropertyOptional({ description: '累积布局偏移' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  cls?: number;

  @ApiPropertyOptional({ description: '首次内容绘制 (ms)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fcp?: number;

  @ApiPropertyOptional({ description: '首字节时间 (ms)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ttfb?: number;

  @ApiPropertyOptional({ description: '输入延迟 (ms)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  inputDelay?: number;

  @ApiPropertyOptional({ description: '导航类型' })
  @IsOptional()
  @IsString()
  navigationType?: string;

  @ApiPropertyOptional({ description: '连接类型' })
  @IsOptional()
  @IsString()
  connectionType?: string;

  @ApiPropertyOptional({ description: '设备像素比' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  devicePixelRatio?: number;

  @ApiPropertyOptional({ description: '视口大小' })
  @IsOptional()
  @IsString()
  viewportSize?: string;
}

export class QueryPerformanceMetricsDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  userId?: number;

  @ApiPropertyOptional({ description: '页面URL' })
  @IsOptional()
  @IsString()
  pageUrl?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number = 20;
}

export class PerformanceStatsDto {
  @ApiProperty({ description: '开始时间' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({
    description: '时间粒度',
    enum: ['hour', 'day', 'week', 'month'],
  })
  @IsOptional()
  @IsString()
  granularity?: string = 'day';

  @ApiPropertyOptional({ description: '页面URL' })
  @IsOptional()
  @IsString()
  pageUrl?: string;
}
