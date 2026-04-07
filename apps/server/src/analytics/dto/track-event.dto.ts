import { IsString, IsOptional, IsNumber, IsArray, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TrackEventDto {
  @ApiProperty({ description: '事件名称', maxLength: 128 })
  @IsString()
  @MaxLength(128)
  eventName: string;

  @ApiPropertyOptional({ description: '事件数据', type: Object })
  @IsOptional()
  eventData?: Record<string, unknown>;
}

export class TrackEventBatchDto {
  @ApiProperty({ description: '事件列表', type: [TrackEventDto] })
  @IsArray()
  @Type(() => TrackEventDto)
  events: TrackEventDto[];
}

export class QueryTrackEventsDto {
  @ApiPropertyOptional({ description: '事件名称' })
  @IsOptional()
  @IsString()
  eventName?: string;

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

export class TrackEventStatsDto {
  @ApiProperty({ description: '事件名称' })
  @IsString()
  eventName: string;

  @ApiProperty({ description: '开始时间' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: '时间粒度', enum: ['hour', 'day', 'week', 'month'] })
  @IsOptional()
  @IsEnum(['hour', 'day', 'week', 'month'])
  granularity?: 'hour' | 'day' | 'week' | 'month' = 'day';
}
