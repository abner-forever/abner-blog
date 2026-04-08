import { Injectable, Logger } from '@nestjs/common';
import { WeatherService } from '../../weather/weather.service';
import type { GetWeatherInput, GetAirQualityInput } from '../schemas';

@Injectable()
export class WeatherTools {
  private readonly logger = new Logger(WeatherTools.name);

  constructor(private readonly weatherService: WeatherService) {}

  /**
   * 获取天气信息工具
   * 提供城市名称和日期，返回详细天气信息
   */
  async getWeather(params: GetWeatherInput) {
    try {
      this.logger.debug(`getWeather params: ${JSON.stringify(params)}`);
      const weather = await this.weatherService.getWeather(
        'unknown',
        params.city,
        undefined,
        params.date,
      );

      console.log('weather data', weather);

      if (weather.unavailable) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `无法获取 ${params.city} 的天气数据，请稍后再试。`,
            },
          ],
        };
      }

      // 并行获取空气质量和天气指数以提供更全面的建议
      const [airQuality, indices] = await Promise.all([
        this.weatherService.getAirQuality('unknown', params.city),
        this.weatherService.getWeatherIndices('unknown', params.city),
      ]);

      const text = this.buildWeatherText(
        weather,
        airQuality,
        indices,
        params.date,
      );

      return {
        content: [{ type: 'text' as const, text }],
        structuredContent: {
          city: weather.city,
          temperature: weather.temperature,
          temperatureMax: weather.temperatureMax,
          temperatureMin: weather.temperatureMin,
          weatherText: weather.weatherText,
          weatherEmoji: weather.weatherEmoji,
          windspeed: weather.windspeed,
          humidity: weather.humidity,
          isDay: weather.isDay,
          precip: weather.precip,
          airQuality: airQuality
            ? {
                aqi: airQuality.aqi,
                level: airQuality.level,
                pm2_5: airQuality.pm2_5,
                pm10: airQuality.pm10,
              }
            : null,
          indices: indices
            ? {
                dressing: indices.dressingIndex,
                coldRisk: indices.coldRiskIndex,
                uv: indices.uvIndex,
                comfort: indices.comfortIndex,
              }
            : null,
        },
      };
    } catch (error) {
      this.logger.error(`getWeather tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `获取天气信息时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 获取空气质量工具
   */
  async getAirQuality(params: GetAirQualityInput) {
    try {
      const airQuality = await this.weatherService.getAirQuality(
        'unknown',
        params.city,
      );

      if (!airQuality) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `无法获取 ${params.city} 的空气质量数据。`,
            },
          ],
        };
      }

      const advice = this.buildAirQualityAdvice(airQuality);

      return {
        content: [
          {
            type: 'text' as const,
            text: `${params.city} 当前空气质量：\n- AQI：${airQuality.aqi}\n- 等级：${airQuality.level}\n- 首要污染物：${airQuality.primaryPollutant}\n- PM2.5：${airQuality.pm2_5} μg/m³\n- PM10：${airQuality.pm10} μg/m³\n\n${advice}`,
          },
        ],
        structuredContent: airQuality,
      };
    } catch (error) {
      this.logger.error(`getAirQuality tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `获取空气质量时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  private buildWeatherText(
    weather: {
      city: string;
      temperature: number;
      temperatureMax: number;
      temperatureMin: number;
      weatherText: string;
      weatherEmoji: string;
      windspeed: number;
      humidity?: number;
      precip?: number;
      isDay: boolean;
    },
    airQuality: {
      aqi: number;
      level: string;
      primaryPollutant: string;
      healthAdvice: string;
      pm2_5: number;
      pm10: number;
    } | null,
    indices: {
      dressingIndex: string;
      coldRiskIndex: string;
      uvIndex: string;
      comfortIndex: string;
    } | null,
    date?: string,
  ): string {
    // 根据日期动态生成"今日"/"明日"/"后日"等
    let dayLabel = '今日';
    if (date) {
      const queryDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      queryDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (queryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 0) {
        dayLabel = '今日';
      } else if (diffDays === 1) {
        dayLabel = '明日';
      } else if (diffDays === 2) {
        dayLabel = '后日';
      } else if (diffDays === 3) {
        dayLabel = '大后日';
      } else {
        // 超过3天显示具体日期
        dayLabel = `${queryDate.getMonth() + 1}月${queryDate.getDate()}日`;
      }
    }

    const parts: string[] = [];

    parts.push(
      `${weather.city}${dayLabel}天气：当前温度${weather.temperature}°C，最高温度${weather.temperatureMax}°C，最低温度${weather.temperatureMin}°C，${weather.weatherText}，风速${weather.windspeed}km/h。`,
    );

    // 穿衣建议
    if (indices?.dressingIndex && indices.dressingIndex !== '未知') {
      parts.push(`穿衣建议：${indices.dressingIndex}`);
    } else if (weather.temperature < 10) {
      parts.push('气温较低，建议穿着厚外套保暖。');
    } else if (weather.temperature < 20) {
      parts.push('气温较为舒适，建议穿着轻薄外套或长袖。');
    } else {
      parts.push('气温较高，建议穿着轻薄透气衣物。');
    }

    // 降雨提醒
    if (weather.precip && weather.precip > 0) {
      parts.push(`${dayLabel}有降雨可能，出门记得带伞。`);
    }

    // 空气质量
    if (airQuality) {
      if (airQuality.aqi > 100) {
        parts.push(
          `空气质量：${airQuality.level}（AQI ${airQuality.aqi}），首要污染物${airQuality.primaryPollutant}。敏感人群建议减少户外活动或佩戴口罩。`,
        );
      } else if (airQuality.aqi > 50) {
        parts.push(
          `空气质量：${airQuality.level}（AQI ${airQuality.aqi}），良好。`,
        );
      }
    }

    // 紫外线
    if (indices?.uvIndex && indices.uvIndex !== '未知') {
      if (indices.uvIndex.includes('强') || indices.uvIndex.includes('很高')) {
        parts.push(`紫外线：${indices.uvIndex}，外出请注意防晒。`);
      }
    }

    // 感冒指数
    if (indices?.coldRiskIndex && indices.coldRiskIndex !== '未知') {
      parts.push(`感冒指数：${indices.coldRiskIndex}`);
    }

    return parts.join('\n');
  }

  private buildAirQualityAdvice(airQuality: {
    aqi: number;
    level: string;
    primaryPollutant: string;
    healthAdvice: string;
    sensitiveAdvice: string;
  }): string {
    const adviceParts: string[] = [];

    if (airQuality.aqi <= 50) {
      adviceParts.push('空气质量良好，适合所有户外活动。');
    } else if (airQuality.aqi <= 100) {
      adviceParts.push(
        `空气质量${airQuality.level}，${airQuality.healthAdvice || '极少数敏感人群需注意。'}`,
      );
    } else if (airQuality.aqi <= 150) {
      adviceParts.push(
        `空气质量${airQuality.level}（AQI ${airQuality.aqi}），敏感人群建议减少户外剧烈活动。`,
      );
      if (airQuality.primaryPollutant) {
        adviceParts.push(`主要污染物为${airQuality.primaryPollutant}。`);
      }
    } else if (airQuality.aqi <= 200) {
      adviceParts.push(
        `空气质量${airQuality.level}（AQI ${airQuality.aqi}），所有人都应减少户外活动。敏感人群应避免外出。`,
      );
    } else {
      adviceParts.push(
        `空气质量${airQuality.level}（AQI ${airQuality.aqi}），建议避免一切户外活动。`,
      );
    }

    return adviceParts.join('');
  }
}
