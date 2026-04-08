import { Controller, Get, Req, Query, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { Request } from 'express';
import { WeatherService } from './weather.service';
import {
  WeatherInfoFallback,
  WeatherInfoResponse,
} from './dto/weather-info.response';

@ApiExtraModels(WeatherInfoResponse, WeatherInfoFallback)
@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({
    summary: '根据 IP 或城市获取天气',
    operationId: 'getWeather',
  })
  @Get()
  @ApiQuery({
    name: 'location',
    required: false,
    description:
      '城市名称，支持文字搜索，如"北京"；也支持经纬度坐标（lon,lat）、LocationID 或 Adcode',
  })
  @ApiQuery({
    name: 'adm',
    required: false,
    description:
      '上级行政区划，用于排除重名城市，如 adm=北京 可确定查询的是北京市而非朝阳市',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: '目标日期（YYYY-MM-DD），默认当天',
  })
  @ApiOkResponse({
    description: '天气信息',
    type: WeatherInfoResponse,
  })
  async getWeather(
    @Req() req: Request,
    @Query('location') location?: string,
    @Query('adm') adm?: string,
    @Query('date') date?: string,
  ): Promise<WeatherInfoResponse> {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? '');

    const data = await this.weatherService.getWeather(
      clientIp,
      location,
      adm,
      date,
    );
    if (data.fallback?.isFallback) {
      throw new NotFoundException(
        '城市 "' + data.fallback.requestedCity + '" 未找到或不支持',
      );
    }
    return data;
  }
}
