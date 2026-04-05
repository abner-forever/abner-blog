import { ApiProperty } from '@nestjs/swagger';
import { CalendarEventType } from '../../../entities/calendar-event.entity';

export class CalendarEventDto {
  @ApiProperty({ description: '事件 ID' })
  id: number;

  @ApiProperty({ description: '事件标题' })
  title: string;

  @ApiProperty({ required: false, nullable: true, description: '事件描述' })
  description: string | null;

  @ApiProperty({ description: '开始时间' })
  startDate: Date;

  @ApiProperty({ required: false, nullable: true, description: '结束时间' })
  endDate: Date | null;

  @ApiProperty({ enum: CalendarEventType, description: '事件类型' })
  type: CalendarEventType;

  @ApiProperty({ description: '是否全天事件' })
  allDay: boolean;

  @ApiProperty({ required: false, nullable: true, description: '地点' })
  location: string | null;

  @ApiProperty({ required: false, nullable: true, description: '颜色' })
  color: string | null;

  @ApiProperty({ description: '是否公开' })
  isPublic: boolean;

  @ApiProperty({ description: '是否已完成' })
  completed: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
