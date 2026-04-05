import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CalendarEventType } from '../../entities/calendar-event.entity';

export class CreateCalendarEventDto {
  @ApiProperty({ description: '事件标题' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, description: '事件描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '开始时间（ISO 8601）',
    example: '2024-01-01T09:00:00Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    required: false,
    description: '结束时间（ISO 8601）',
    example: '2024-01-01T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    enum: CalendarEventType,
    required: false,
    description: '事件类型',
    default: CalendarEventType.EVENT,
  })
  @IsEnum(CalendarEventType)
  @IsOptional()
  type?: CalendarEventType;

  @ApiProperty({ required: false, description: '是否全天事件' })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiProperty({ required: false, description: '地点' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    required: false,
    description: '颜色（十六进制）',
    example: '#FF5733',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false, description: '是否公开', default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateCalendarEventDto {
  @ApiProperty({ required: false, description: '事件标题' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: '事件描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, description: '开始时间（ISO 8601）' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false, description: '结束时间（ISO 8601）' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    enum: CalendarEventType,
    required: false,
    description: '事件类型',
  })
  @IsEnum(CalendarEventType)
  @IsOptional()
  type?: CalendarEventType;

  @ApiProperty({ required: false, description: '是否全天事件' })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiProperty({ required: false, description: '地点' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false, description: '颜色（十六进制）' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ required: false, description: '是否公开' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ required: false, description: '是否已完成' })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
