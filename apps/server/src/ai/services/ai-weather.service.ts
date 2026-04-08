import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { extractWeatherQueryContext } from '../langchain/chains';
import type { ChatLLM } from '../langchain/model';
import { WeatherService } from '../../weather/weather.service';
import {
  WEATHER_ANALYSIS_PROMPT,
  WEATHER_MCP_USER_REPLY_PROMPT,
} from '../langchain/prompts';
import { getTextContent } from '../langchain/parsers';

type WeatherPayload = {
  city: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  isDay: boolean;
  windspeed: number;
  humidity?: number;
  precip?: number;
  unavailable?: boolean;
  fallback?: {
    isFallback: boolean;
    requestedCity?: string;
  };
};

type AirQualityPayload = {
  aqi: number;
  level: string;
  primaryPollutant: string;
  healthAdvice: string;
  sensitiveAdvice: string;
  pm2_5: number;
  pm10: number;
};

type WeatherIndicesPayload = {
  dressingIndex: string;
  coldRiskIndex: string;
  uvIndex: string;
  comfortIndex: string;
};

@Injectable()
export class AIWeatherService {
  private readonly logger = new Logger(AIWeatherService.name);

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

    // 并行获取天气、空气质量和生活指数
    const [weather, airQuality, indices] = await Promise.all([
      this.weatherService.getWeather(
        'unknown',
        city,
        weatherQueryContext.adm,
        weatherQueryContext.date,
      ),
      this.weatherService.getAirQuality('unknown', city),
      this.weatherService.getWeatherIndices('unknown', city),
    ]);

    process.stderr.write(`[AI Weather] Weather: ${JSON.stringify(weather)}\n`);
    process.stderr.write(
      `[AI Weather] AirQuality: ${JSON.stringify(airQuality)}\n`,
    );
    process.stderr.write(`[AI Weather] Indices: ${JSON.stringify(indices)}\n`);

    // 使用 AI 生成详细分析
    return this.buildAIAnalysis(
      llm,
      weather,
      airQuality ?? null,
      indices ?? null,
      weatherQueryContext.label,
      message,
    );
  }

  /**
   * MCP 天气工具仅返回结构化事实文本，此处用 LLM 结合用户原话生成完整回复（含运动/出行等延伸问题）。
   */
  buildMcpWeatherUserReplyMessages(
    userMessage: string,
    mcpWeatherText: string,
  ): [SystemMessage, HumanMessage] | null {
    const facts = mcpWeatherText.trim();
    if (!facts) return null;
    const prompt = WEATHER_MCP_USER_REPLY_PROMPT.replace(
      '{userQuestion}',
      userMessage.trim(),
    ).replace('{weatherFacts}', facts);
    return [
      new SystemMessage(
        '你是贴心的天气与生活助手。下方「天气工具输出」为唯一事实来源，不得编造其中没有的数值或地点。',
      ),
      new HumanMessage(prompt),
    ];
  }

  /**
   * MCP 天气工具仅返回结构化事实文本，此处用 LLM 结合用户原话生成完整回复（含运动/出行等延伸问题）。
   */
  async composeMcpWeatherUserReply(
    llm: ChatLLM,
    userMessage: string,
    mcpWeatherText: string,
  ): Promise<string> {
    const facts = mcpWeatherText.trim();
    if (!facts) return '获取天气信息失败';
    const messages = this.buildMcpWeatherUserReplyMessages(
      userMessage,
      mcpWeatherText,
    );
    if (!messages) return '获取天气信息失败';

    try {
      const result = await llm.invoke(messages);
      const text = getTextContent(result).trim();
      return text || facts;
    } catch (err) {
      this.logger.warn(`MCP weather synthesis failed: ${String(err)}`);
      return facts;
    }
  }

  private async buildAIAnalysis(
    llm: ChatLLM,
    weather: WeatherPayload,
    airQuality: AirQualityPayload | null,
    indices: WeatherIndicesPayload | null,
    dateLabel: string,
    userQuestion: string,
  ): Promise<string> {
    if (weather.unavailable) {
      return `${weather.city}${dateLabel}的天气数据暂时无法获取（连接天气服务超时或网络异常），请稍后再试。`;
    }

    const weatherText = this.weatherService.getWeatherText(
      weather.weatherCode,
      weather.isDay,
    );

    // 构建提示词
    const prompt = WEATHER_ANALYSIS_PROMPT.replace(
      '{currentDate}',
      new Date().toISOString().split('T')[0],
    )
      .replace('{userQuestion}', userQuestion.trim())
      .replace('{city}', weather.city)
      .replace('{dateLabel}', dateLabel)
      .replace('{weatherText}', weatherText)
      .replace('{temperature}', String(weather.temperature))
      .replace('{temperatureMax}', String(weather.temperatureMax))
      .replace('{temperatureMin}', String(weather.temperatureMin))
      .replace('{windspeed}', String(weather.windspeed))
      .replace(
        '{humidity}',
        weather.humidity !== undefined ? String(weather.humidity) : '未知',
      )
      .replace(
        '{precip}',
        weather.precip !== undefined ? String(weather.precip) : '0',
      )
      .replace('{isDay}', weather.isDay ? '是' : '否')
      .replace('{aqi}', airQuality ? String(airQuality.aqi) : '无数据')
      .replace('{airLevel}', airQuality?.level ?? '无数据')
      .replace('{primaryPollutant}', airQuality?.primaryPollutant ?? '无')
      .replace('{healthAdvice}', airQuality?.healthAdvice ?? '无')
      .replace('{pm25}', airQuality ? String(airQuality.pm2_5) : '无数据')
      .replace('{pm10}', airQuality ? String(airQuality.pm10) : '无数据')
      .replace('{dressingIndex}', indices?.dressingIndex ?? '无数据')
      .replace('{coldRiskIndex}', indices?.coldRiskIndex ?? '无数据')
      .replace('{uvIndex}', indices?.uvIndex ?? '无数据')
      .replace('{comfortIndex}', indices?.comfortIndex ?? '无数据');

    try {
      const result = await llm.invoke([
        new SystemMessage(
          '你是一个贴心的天气生活助手，用温暖的语气与用户交流。',
        ),
        new HumanMessage(prompt),
      ]);

      const content = result.content;
      if (typeof content === 'string' && content.trim()) {
        return content.trim();
      }

      // Fallback: 如果 AI 返回格式异常，使用基础回复
      return this.buildWeatherReply(weather, dateLabel);
    } catch (err) {
      this.logger.warn(`AI weather analysis failed: ${err}`);
      // AI 分析失败时使用基础回复
      return this.buildWeatherReply(weather, dateLabel);
    }
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

    const weatherText = this.weatherService.getWeatherText(
      weather.weatherCode,
      weather.isDay,
    );

    const parts: string[] = [];
    parts.push(
      `${cityLabel}${dateLabel}天气：当前温度${weather.temperature}°C，最高${weather.temperatureMax}°C，最低${weather.temperatureMin}°C，风速${weather.windspeed}km/h，天气${weatherText}。`,
    );

    // 添加穿衣建议
    if (weather.temperature < 10) {
      parts.push('气温较低，建议穿着厚外套保暖。');
    } else if (weather.temperature < 20) {
      parts.push('气温较为舒适，建议穿着轻薄外套或长袖。');
    } else {
      parts.push('气温较高，建议穿着轻薄透气衣物。');
    }

    // 添加降雨提醒
    if (weather.precip && weather.precip > 0) {
      parts.push('有降雨可能，出门建议带伞。');
    }

    return parts.join('');
  }
}
