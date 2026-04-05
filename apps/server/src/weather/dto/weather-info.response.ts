import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * OpenAPI / Orval 中「对象 vs 列表」的常见写法：
 *
 * - **单个对象**：`@ApiResponse({ status: 200, type: WeatherInfoResponse })`
 * - **顶层数组**：`@ApiResponse({ status: 200, type: WeatherInfoResponse, isArray: true })`
 * - **带列表字段的复合体**（如分页）：再建一个 DTO，用 `@ApiProperty({ type: [ItemDto] })` 声明 list 字段（参考 TodoListResponseDto）
 */
export class WeatherInfoFallback {
  @ApiProperty({ description: '是否为回退结果（如城市无法精确定位）' })
  isFallback: boolean;

  @ApiPropertyOptional({ description: '用户请求的城市原文' })
  requestedCity?: string;

  @ApiPropertyOptional({ description: '回退原因说明' })
  reason?: string;
}

export class WeatherInfoResponse {
  @ApiProperty({ description: '城市名称' })
  city: string;

  @ApiProperty({ description: '纬度' })
  latitude: number;

  @ApiProperty({ description: '经度' })
  longitude: number;

  @ApiPropertyOptional({ description: '预报日期（YYYY-MM-DD）' })
  forecastDate?: string;

  @ApiProperty({ description: '当前气温（℃）' })
  temperature: number;

  @ApiProperty({ description: '最高气温（℃）' })
  temperatureMax: number;

  @ApiProperty({ description: '最低气温（℃）' })
  temperatureMin: number;

  @ApiProperty({ description: 'WMO 天气代码' })
  weatherCode: number;

  @ApiProperty({ description: '是否白天' })
  isDay: boolean;

  @ApiProperty({ description: '风速（km/h）' })
  windspeed: number;

  @ApiPropertyOptional({
    description: '上游不可用时的占位数据，不应作为真实天气展示',
  })
  unavailable?: boolean;

  @ApiPropertyOptional({
    type: WeatherInfoFallback,
    description: '城市回退等附加信息',
  })
  fallback?: WeatherInfoFallback;
}
