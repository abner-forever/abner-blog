import { Controller, Get, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({ summary: '根据 IP 或城市获取天气' })
  @Get()
  @ApiQuery({
    name: 'city',
    required: false,
    description: '城市名称，如北京、上海',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '目标日期（YYYY-MM-DD），默认当天',
  })
  async getWeather(
    @Req() req: Request,
    @Query('city') city?: string,
    @Query('date') date?: string,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? '');

    return this.weatherService.getWeather(clientIp, city, date);
  }
}
