import { Injectable } from '@nestjs/common';
import { extractWeatherQueryContext } from '../langchain/chains';
import type { ChatLLM } from '../langchain/model';
import { WeatherService } from '../../weather/weather.service';

type WeatherPayload = {
  city: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  isDay: boolean;
  windspeed: number;
  unavailable?: boolean;
  fallback?: {
    isFallback: boolean;
    requestedCity?: string;
  };
};

@Injectable()
export class AIWeatherService {
  constructor(private readonly weatherService: WeatherService) {}

  async buildWeatherResponse(
    llm: ChatLLM,
    message: string,
    currentDate: string,
  ): Promise<string> {
    const weatherQueryContext = await extractWeatherQueryContext(
      llm,
      message,
      currentDate,
    );
    const city =
      weatherQueryContext.city ||
      this.extractCityFromWeatherQuery(message) ||
      '北京';

    process.stderr.write(
      `[AI Weather] City: ${city}, date: ${weatherQueryContext.date}, label: ${weatherQueryContext.label}\n`,
    );

    const weather = await this.weatherService.getWeather(
      'unknown',
      city,
      weatherQueryContext.date,
    );
    process.stderr.write(`[AI Weather] Weather: ${JSON.stringify(weather)}\n`);
    return this.buildWeatherReply(weather, weatherQueryContext.label);
  }

  private extractCityFromWeatherQuery(message: string): string | null {
    const text = this.normalizeWeatherQueryText(message.trim());
    const knownCity = this.extractKnownCityFromText(text);
    if (knownCity) return knownCity;

    const cityMatch = text.match(
      /(?:查询|查下|查一下|看看|看下|看一下)?\s*([^\s，。,.!?！？:：]{1,20}?(?:市|区|县|州|特别行政区))\s*(?:的)?(?:天气|气温|温度)?/,
    );
    if (cityMatch?.[1]) return cityMatch[1].trim();

    const plainMatch = text.match(
      /(?:在|到|去)\s*([^\s，。,.!?！？:：]{2,20}?(?:市|区|县|州|特别行政区))/,
    );
    if (plainMatch?.[1]) return plainMatch[1].trim();

    const bareLocationMatch = text.match(
      /([^\s，。,.!?！？:：]{2,20}?)(?:的)?(?:天气|气温|温度|降雨|风速|风力)/,
    );
    if (bareLocationMatch?.[1]) {
      const candidate = bareLocationMatch[1]
        .replace(/^(请问|请|帮我|帮忙|查询|查下|查一下|看看|看下|看一下)/, '')
        .trim();
      if (candidate) return candidate;
    }
    return null;
  }

  private extractKnownCityFromText(text: string): string | null {
    const knownCities = [
      '北京',
      '上海',
      '广州',
      '深圳',
      '成都',
      '杭州',
      '武汉',
      '西安',
      '南京',
      '重庆',
      '天津',
      '苏州',
      '郑州',
      '长沙',
      '青岛',
      '沈阳',
      '大连',
      '厦门',
      '昆明',
      '哈尔滨',
      '香港',
      '澳门',
    ];
    for (const city of knownCities) {
      if (text.includes(city)) return city;
    }
    return null;
  }

  private normalizeWeatherQueryText(text: string): string {
    return text
      .replace(
        /^(今天|明天|后天|今晚|今早|明早|昨天|现在|当前|此刻|这会儿)\s*/,
        '',
      )
      .replace(
        /\s*(今天|明天|后天|今晚|今早|明早|昨天|现在|当前|此刻|这会儿)\s*/g,
        '',
      )
      .replace(/[，。,.!?！？]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildWeatherReply(
    weather: WeatherPayload,
    dateLabel: string,
  ): string {
    const cityLabel =
      weather.fallback?.isFallback && weather.fallback.requestedCity
        ? `${weather.city}（未精确定位${weather.fallback.requestedCity}）`
        : weather.city;

    if (weather.unavailable) {
      return `${cityLabel}${dateLabel}的天气数据暂时无法获取（连接天气服务超时或网络异常），请稍后再试。`;
    }

    const weatherText = this.getWeatherDescription(
      weather.weatherCode,
      weather.isDay,
    );
    return `${cityLabel}${dateLabel}天气：当前温度${weather.temperature}°C，最高${weather.temperatureMax}°C，最低${weather.temperatureMin}°C，风速${weather.windspeed}km/h，天气${weatherText}。`;
  }

  private getWeatherDescription(weatherCode: number, isDay: boolean): string {
    if (weatherCode === 0) return isDay ? '晴' : '晴夜';
    if ([1, 2, 3].includes(weatherCode)) return '多云';
    if ([45, 48].includes(weatherCode)) return '雾';
    if ([51, 53, 55, 56, 57].includes(weatherCode)) return '毛毛雨';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return '下雨';
    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return '下雪';
    if ([95, 96, 99].includes(weatherCode)) return '雷暴';
    return '未知';
  }
}
