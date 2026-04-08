import { ApiProperty } from '@nestjs/swagger';

/** 天气工具输出 */
export class WeatherToolOutput {
  @ApiProperty({ description: '城市名称' })
  city: string;

  @ApiProperty({ description: '当前温度（℃）' })
  temperature: number;

  @ApiProperty({ description: '最高温度（℃）' })
  temperatureMax: number;

  @ApiProperty({ description: '最低温度（℃）' })
  temperatureMin: number;

  @ApiProperty({ description: '天气描述' })
  weatherText: string;

  @ApiProperty({ description: '天气图标 emoji' })
  weatherEmoji: string;

  @ApiProperty({ description: '风速（km/h）' })
  windspeed: number;

  @ApiProperty({ description: '湿度（%）' })
  humidity: number;

  @ApiProperty({ description: '是否白天' })
  isDay: boolean;

  @ApiProperty({ required: false, description: '降雨量（mm）' })
  precip?: number;

  @ApiProperty({ required: false, description: '空气质量等级' })
  airQualityLevel?: string;

  @ApiProperty({ required: false, description: '穿衣指数' })
  dressingAdvice?: string;

  @ApiProperty({ required: false, description: '感冒指数' })
  coldRiskAdvice?: string;
}

/** 日程工具输出 */
export class EventToolOutput {
  @ApiProperty({ description: '日程 ID' })
  id: number;

  @ApiProperty({ description: '日程标题' })
  title: string;

  @ApiProperty({ description: '开始时间' })
  startDate: string;

  @ApiProperty({ required: false, description: '结束时间' })
  endDate?: string;

  @ApiProperty({ description: '是否全天' })
  allDay: boolean;

  @ApiProperty({ required: false, description: '地点' })
  location?: string;

  @ApiProperty({ required: false, description: '描述' })
  description?: string;

  @ApiProperty({ description: '是否已完成' })
  completed: boolean;
}

/** 待办工具输出 */
export class TodoToolOutput {
  @ApiProperty({ description: '待办 ID' })
  id: number;

  @ApiProperty({ description: '待办标题' })
  title: string;

  @ApiProperty({ required: false, description: '描述' })
  description?: string;

  @ApiProperty({ description: '是否已完成' })
  completed: boolean;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}
