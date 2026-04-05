import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  forecastDate?: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  isDay: boolean;
  windspeed: number;
  /** 上游 API 失败或超时，数值为占位 0，不应当作真实天气展示 */
  unavailable?: boolean;
  fallback?: {
    isFallback: boolean;
    requestedCity?: string;
    reason?: string;
  };
}

/** ip-api.com 响应结构 */
interface IpApiResponse {
  status: 'success' | 'fail';
  city: string;
  lat: number;
  lon: number;
  query: string;
}

/** open-meteo 响应结构 */
interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    weathercode: number;
    is_day: number;
    windspeed: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode?: number[];
    windspeed_10m_max?: number[];
  };
}

/** open-meteo 新版 current 参数响应结构 */
interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    is_day?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
    wind_speed_10m_max?: number[];
  };
}

/** open-meteo 地理编码响应结构 */
interface OpenMeteoGeocodeResponse {
  results?: Array<{
    name?: string;
    latitude?: number;
    longitude?: number;
    country_code?: string;
  }>;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  /** Redis 缓存 key 前缀 */
  private readonly CACHE_PREFIX = 'weather:';
  /** 缓存 key 版本，避免旧错误缓存污染 */
  private readonly CACHE_VERSION = 'v2';
  /** 缓存 TTL = 30 分钟（秒） */
  private readonly CACHE_TTL_SEC = 30 * 60;
  /** 进程内 L1 缓存 TTL = 60 秒（毫秒） */
  private readonly L1_CACHE_TTL_MS = 60 * 1000;
  /** 进程内 L1 缓存容量上限，避免无界增长 */
  private readonly L1_CACHE_MAX_SIZE = 1000;
  /** Open-Meteo 在海外节点，国内访问易超时，默认放宽；可通过 WEATHER_HTTP_TIMEOUT_MS 覆盖 */
  private readonly TIMEOUT = Math.min(
    Math.max(
      Number.parseInt(process.env.WEATHER_HTTP_TIMEOUT_MS || '15000', 10) ||
        15000,
      5000,
    ),
    60000,
  );
  private readonly memoryCache = new Map<
    string,
    {
      data: WeatherData;
      expiresAt: number;
      lastAccessAt: number;
    }
  >();

  /** 中国主要城市坐标映射 */
  private readonly cityCoords: Record<string, { lat: number; lon: number }> = {
    北京: { lat: 39.9042, lon: 116.4074 },
    上海: { lat: 31.2304, lon: 121.4737 },
    广州: { lat: 23.1291, lon: 113.2644 },
    深圳: { lat: 22.5431, lon: 114.0579 },
    成都: { lat: 30.5728, lon: 104.0668 },
    杭州: { lat: 30.2741, lon: 120.1551 },
    武汉: { lat: 30.5928, lon: 114.3055 },
    西安: { lat: 34.3416, lon: 108.9398 },
    南京: { lat: 32.0603, lon: 118.7969 },
    重庆: { lat: 29.4316, lon: 106.9123 },
    天津: { lat: 39.3434, lon: 117.3616 },
    苏州: { lat: 31.2989, lon: 120.5853 },
    郑州: { lat: 34.7466, lon: 113.6253 },
    长沙: { lat: 28.2282, lon: 112.9388 },
    青岛: { lat: 36.0671, lon: 120.3826 },
    沈阳: { lat: 41.8057, lon: 123.4315 },
    大连: { lat: 38.914, lon: 121.6147 },
    厦门: { lat: 24.4798, lon: 118.0894 },
    昆明: { lat: 25.0406, lon: 102.7129 },
    哈尔滨: { lat: 45.8038, lon: 126.534 },
    香港: { lat: 22.3193, lon: 114.1694 },
    澳门: { lat: 22.1987, lon: 113.5439 },
  };

  constructor(private readonly redisService: RedisService) {}

  async getWeather(
    clientIp: string,
    city?: string,
    targetDate?: string,
  ): Promise<WeatherData> {
    const ip = this.normalizeIp(clientIp);
    const normalizedCity = this.normalizeCity(city);
    const normalizedDate = this.normalizeTargetDate(targetDate);

    // 如果指定了城市，使用城市名称作为缓存 key
    const cacheKey = `${this.CACHE_PREFIX}${this.CACHE_VERSION}:${normalizedCity ? `city:${normalizedCity}` : ip}:${normalizedDate || 'today'}`;

    // L1 命中缓存（进程内，极低延迟）
    const l1Cached = this.getFromMemoryCache(cacheKey);
    if (l1Cached && !this.isInvalidWeatherData(l1Cached)) {
      return l1Cached;
    }

    // 命中缓存
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        const data = JSON.parse(cached) as WeatherData;
        if (this.isInvalidWeatherData(data)) {
          this.logger.warn(`Skip invalid cached weather for ${cacheKey}`);
        } else {
          // Redis 命中回填 L1，提升热点 key 后续访问速度
          this.setToMemoryCache(cacheKey, data);
          return data;
        }
      }
    } catch (err) {
      this.logger.warn(
        `Redis cache get failed, proceeding without cache: ${err}`,
      );
    }

    const data = await this.fetchWeather(ip, normalizedCity, normalizedDate);

    // 写入缓存（Redis 自动 TTL 过期）
    if (!this.isInvalidWeatherData(data) && !data.fallback?.isFallback) {
      try {
        await this.redisService.set(
          cacheKey,
          JSON.stringify(data),
          this.CACHE_TTL_SEC,
        );
      } catch (err) {
        this.logger.warn(`Redis cache set failed: ${err}`);
      }
      this.setToMemoryCache(cacheKey, data);
    } else {
      this.logger.warn(`Skip caching fallback/invalid weather for ${cacheKey}`);
    }

    return data;
  }

  private async fetchWeather(
    ip: string,
    city?: string,
    targetDate?: string,
  ): Promise<WeatherData> {
    // 1. 如果指定了城市，使用城市坐标
    let cityName = city || '未知城市';
    let lat: number;
    let lon: number;
    let fallbackInfo: WeatherData['fallback'] | undefined;

    if (city && this.cityCoords[city]) {
      // 使用预定义的城市坐标
      lat = this.cityCoords[city].lat;
      lon = this.cityCoords[city].lon;
      cityName = city;
    } else if (city) {
      // 尝试通过城市名称获取坐标（原词 + 后缀变体）
      const resolved = await this.resolveCityCoordinates(city);
      if (resolved) {
        cityName = resolved.cityName;
        lat = resolved.lat;
        lon = resolved.lon;
      } else {
        lat = this.cityCoords['北京'].lat;
        lon = this.cityCoords['北京'].lon;
        cityName = '北京';
        fallbackInfo = {
          isFallback: true,
          requestedCity: city,
          reason: 'city_not_resolved',
        };
        this.logger.warn(
          `City geocoding fallback to Beijing for "${city}" (targetDate=${targetDate || 'today'})`,
        );
      }
    } else {
      // 2. 通过 ip-api.com 获取地理位置（server-to-server，无 CORS/bot 问题）
      //    本地开发环境 IP 为 127.0.0.1 时使用默认坐标（北京）
      // 默认北京坐标
      lat = this.cityCoords['北京'].lat;
      lon = this.cityCoords['北京'].lon;

      if (!this.isLocalIp(ip)) {
        try {
          const locRes = await axios.get<IpApiResponse>(
            `http://ip-api.com/json/${ip}?fields=status,city,lat,lon,query&lang=zh-CN`,
            { timeout: this.TIMEOUT },
          );
          if (locRes.data?.status === 'success') {
            cityName = locRes.data.city || cityName;
            lat = locRes.data.lat;
            lon = locRes.data.lon;
          }
        } catch (err: unknown) {
          this.logger.warn(
            `IP geolocation failed for ${ip}: ${(err as Error).message}`,
          );
        }
      } else {
        // 本地环境默认使用北京
        cityName = '北京';
      }
    }

    // 2. 通过 open-meteo 获取天气（免费、无 API Key、支持跨域）
    let temperature = 0;
    let temperatureMax = 0;
    let temperatureMin = 0;
    let weatherCode = 0;
    let isDay = true;
    let windspeed = 0;

    try {
      const wxRes = await axios.get<OpenMeteoResponse>(
        'https://api.open-meteo.com/v1/forecast',
        {
          params: {
            latitude: lat,
            longitude: lon,
            current_weather: true,
            daily:
              'weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max',
            timezone: 'auto',
          },
          timeout: this.TIMEOUT,
        },
      );
      const cw = wxRes.data?.current_weather;
      if (cw) {
        temperature = Math.round(cw.temperature);
        weatherCode = cw.weathercode;
        isDay = cw.is_day === 1;
        windspeed = cw.windspeed;
      }
      // 获取今天的最高温和最低温
      const daily = wxRes.data?.daily;
      const targetIndex = this.resolveDailyIndex(daily?.time, targetDate);
      if (
        daily &&
        daily.temperature_2m_max?.[targetIndex] !== undefined &&
        daily.temperature_2m_min?.[targetIndex] !== undefined
      ) {
        temperatureMax = Math.round(daily.temperature_2m_max[targetIndex]);
        temperatureMin = Math.round(daily.temperature_2m_min[targetIndex]);
        if (targetIndex > 0) {
          temperature = Math.round((temperatureMax + temperatureMin) / 2);
          isDay = true;
        }
      }
      if (daily?.weathercode?.[targetIndex] !== undefined) {
        weatherCode = daily.weathercode[targetIndex];
      }
      if (daily?.windspeed_10m_max?.[targetIndex] !== undefined) {
        windspeed = Math.round(daily.windspeed_10m_max[targetIndex]);
      }
    } catch (err: unknown) {
      this.logger.warn(`Weather fetch failed: ${(err as Error).message}`);
    }

    // 兼容 open-meteo 新版参数格式；旧版失败/返回无效数据时重试一次
    if (
      this.isInvalidWeatherSnapshot(
        temperature,
        temperatureMax,
        temperatureMin,
        windspeed,
      )
    ) {
      try {
        const wxRes = await axios.get<OpenMeteoCurrentResponse>(
          'https://api.open-meteo.com/v1/forecast',
          {
            params: {
              latitude: lat,
              longitude: lon,
              current: 'temperature_2m,weather_code,is_day,wind_speed_10m',
              daily:
                'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max',
              timezone: 'auto',
            },
            timeout: this.TIMEOUT,
          },
        );
        const current = wxRes.data?.current;
        if (typeof current?.temperature_2m === 'number') {
          temperature = Math.round(current.temperature_2m);
        }
        if (typeof current?.weather_code === 'number') {
          weatherCode = current.weather_code;
        }
        if (typeof current?.is_day === 'number') {
          isDay = current.is_day === 1;
        }
        if (typeof current?.wind_speed_10m === 'number') {
          windspeed = current.wind_speed_10m;
        }
        const daily = wxRes.data?.daily;
        const targetIndex = this.resolveDailyIndex(daily?.time, targetDate);
        if (daily?.temperature_2m_max?.[targetIndex] !== undefined) {
          temperatureMax = Math.round(daily.temperature_2m_max[targetIndex]);
        }
        if (daily?.temperature_2m_min?.[targetIndex] !== undefined) {
          temperatureMin = Math.round(daily.temperature_2m_min[targetIndex]);
        }
        if (
          targetIndex > 0 &&
          daily?.temperature_2m_max?.[targetIndex] !== undefined &&
          daily?.temperature_2m_min?.[targetIndex] !== undefined
        ) {
          temperature = Math.round((temperatureMax + temperatureMin) / 2);
          isDay = true;
        }
        if (daily?.weather_code?.[targetIndex] !== undefined) {
          weatherCode = daily.weather_code[targetIndex];
        }
        if (daily?.wind_speed_10m_max?.[targetIndex] !== undefined) {
          windspeed = Math.round(daily.wind_speed_10m_max[targetIndex]);
        }
      } catch (err: unknown) {
        this.logger.warn(
          `Weather fetch retry failed: ${(err as Error).message}`,
        );
      }
    }

    const unavailable = this.isInvalidWeatherSnapshot(
      temperature,
      temperatureMax,
      temperatureMin,
      windspeed,
    );

    return {
      city: cityName,
      latitude: lat,
      longitude: lon,
      forecastDate: targetDate,
      temperature,
      temperatureMax,
      temperatureMin,
      weatherCode,
      isDay,
      windspeed,
      unavailable,
      fallback: fallbackInfo,
    };
  }

  private async resolveCityCoordinates(
    city: string,
  ): Promise<{ cityName: string; lat: number; lon: number } | null> {
    const variants = this.buildCityCandidates(city);
    for (const name of variants) {
      try {
        const geoRes = await axios.get<OpenMeteoGeocodeResponse>(
          'https://geocoding-api.open-meteo.com/v1/search',
          {
            params: {
              name,
              count: 8,
              language: 'zh',
              format: 'json',
            },
            timeout: this.TIMEOUT,
          },
        );
        const best = (geoRes.data?.results || []).find(
          (item) =>
            ['CN', 'HK', 'MO', 'TW'].includes(item.country_code || '') &&
            typeof item.latitude === 'number' &&
            typeof item.longitude === 'number',
        );
        if (best) {
          return {
            cityName: best.name || name,
            lat: best.latitude,
            lon: best.longitude,
          };
        }
      } catch (err: unknown) {
        this.logger.warn(
          `City geocoding failed for "${name}": ${(err as Error).message}`,
        );
      }
    }
    return null;
  }

  private buildCityCandidates(city: string): string[] {
    const base = city.trim();
    if (!base) return [];
    const candidates = new Set<string>([base]);
    if (!/[市县区州旗盟]$/.test(base)) {
      candidates.add(`${base}市`);
      candidates.add(`${base}县`);
      candidates.add(`${base}区`);
    }
    if (base.endsWith('市') || base.endsWith('县') || base.endsWith('区')) {
      candidates.add(base.slice(0, -1));
    }
    return [...candidates];
  }

  /** 标准化 IP：去除 IPv6 映射前缀（::ffff:）*/
  private normalizeIp(ip: string): string {
    return ip?.replace(/^::ffff:/, '') || 'unknown';
  }

  /** 标准化城市参数，避免空白导致缓存 key 分裂 */
  private normalizeCity(city?: string): string | undefined {
    const normalized = city?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeTargetDate(targetDate?: string): string | undefined {
    const text = targetDate?.trim();
    if (!text) return undefined;
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? text : undefined;
  }

  private resolveDailyIndex(
    dailyDates?: string[],
    targetDate?: string,
  ): number {
    if (!dailyDates?.length) return 0;
    if (!targetDate) return 0;
    const index = dailyDates.findIndex((item) => item === targetDate);
    return index >= 0 ? index : 0;
  }

  private getFromMemoryCache(cacheKey: string): WeatherData | null {
    const now = Date.now();
    const entry = this.memoryCache.get(cacheKey);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= now) {
      this.memoryCache.delete(cacheKey);
      return null;
    }
    entry.lastAccessAt = now;
    return entry.data;
  }

  private setToMemoryCache(cacheKey: string, data: WeatherData): void {
    const now = Date.now();
    if (
      this.memoryCache.size >= this.L1_CACHE_MAX_SIZE &&
      !this.memoryCache.has(cacheKey)
    ) {
      this.evictOldestMemoryCache();
    }
    this.memoryCache.set(cacheKey, {
      data,
      expiresAt: now + this.L1_CACHE_TTL_MS,
      lastAccessAt: now,
    });
  }

  private evictOldestMemoryCache(): void {
    let oldestKey: string | null = null;
    let oldestAccessAt = Number.POSITIVE_INFINITY;
    for (const [key, value] of this.memoryCache) {
      if (value.lastAccessAt < oldestAccessAt) {
        oldestAccessAt = value.lastAccessAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private isLocalIp(ip: string): boolean {
    return (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === 'localhost' ||
      ip === 'unknown'
    );
  }

  private isInvalidWeatherSnapshot(
    temperature: number,
    temperatureMax: number,
    temperatureMin: number,
    windspeed: number,
  ): boolean {
    return (
      temperature === 0 &&
      temperatureMax === 0 &&
      temperatureMin === 0 &&
      windspeed === 0
    );
  }

  private isInvalidWeatherData(data: WeatherData): boolean {
    return this.isInvalidWeatherSnapshot(
      data.temperature,
      data.temperatureMax,
      data.temperatureMin,
      data.windspeed,
    );
  }
}
