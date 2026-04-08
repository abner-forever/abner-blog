import { Injectable, Logger } from '@nestjs/common';
import { createPrivateKey, sign as cryptoSign } from 'crypto';
import axios from 'axios';
import { RedisService } from '../redis/redis.service';

const WEATHER_CODE_MAP: Record<number, { text: string; emoji: string }> = {
  0: { text: '晴', emoji: '☀️' },
  1: { text: '大体晴朗', emoji: '🌤️' },
  2: { text: '局部多云', emoji: '⛅' },
  3: { text: '阴天', emoji: '☁️' },
  45: { text: '有雾', emoji: '🌫️' },
  48: { text: '冰雾', emoji: '🌫️' },
  51: { text: '轻毛毛雨', emoji: '🌦️' },
  53: { text: '毛毛雨', emoji: '🌦️' },
  55: { text: '大毛毛雨', emoji: '🌦️' },
  61: { text: '小雨', emoji: '🌧️' },
  63: { text: '中雨', emoji: '🌧️' },
  65: { text: '大雨', emoji: '🌧️' },
  71: { text: '小雪', emoji: '🌨️' },
  73: { text: '中雪', emoji: '🌨️' },
  75: { text: '大雪', emoji: '🌨️' },
  77: { text: '冰晶', emoji: '❄️' },
  80: { text: '阵雨', emoji: '🌦️' },
  81: { text: '阵雨', emoji: '🌦️' },
  82: { text: '暴雨', emoji: '⛈️' },
  85: { text: '阵雪', emoji: '🌨️' },
  86: { text: '大阵雪', emoji: '🌨️' },
  95: { text: '雷暴', emoji: '⛈️' },
  96: { text: '冰雹雷暴', emoji: '⛈️' },
  99: { text: '大冰雹雷暴', emoji: '⛈️' },
};

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  forecastDate?: string;
  temperature: number;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  weatherText: string;
  weatherEmoji: string;
  isDay: boolean;
  windspeed: number;
  humidity?: number;
  precip?: number;
  /** 上游 API 失败或超时，数值为占位 0，不应当作真实天气展示 */
  unavailable?: boolean;
  fallback?: {
    isFallback: boolean;
    requestedCity?: string;
    reason?: string;
  };
}

/** 空气质量数据 */
export interface AirQualityData {
  [key: string]: unknown;
  aqi: number; // 空气质量指数 (AQI)
  level: string; // 空气质量等级 (优/良/轻度污染/中度污染/重度污染/严重污染)
  category: string; // 英文 category (Excellent/Good/Light pollution/etc.)
  primaryPollutant: string; // 首要污染物
  healthAdvice: string; // 对一般人群的健康建议
  sensitiveAdvice: string; // 对敏感人群的健康建议
  pm2_5: number; // PM2.5 浓度 (μg/m³)
  pm10: number; // PM10 浓度 (μg/m³)
  no2: number; // 二氧化氮 (μg/m³)
  so2: number; // 二氧化硫 (μg/m³)
  co: number; // 一氧化碳 (mg/m³)
  o3: number; // 臭氧 (μg/m³)
}

/** 生活指数数据 */
export interface WeatherIndicesData {
  [key: string]: unknown;
  dressingIndex: string; // 穿衣指数
  dressingLevel: string; // 穿衣指数级别
  uvIndex: string; // UV 指数描述
  carWashingIndex: string; // 洗车指数
  coldRiskIndex: string; // 感冒指数
  comfortIndex: string; // 舒适度指数
  sportIndex: string; // 运动指数
}

/** 和风天气地理编码响应 */
interface QweatherGeoResponse {
  code: string;
  location?: Array<{
    name: string;
    id: string;
    lat: string;
    lon: string;
    adm2?: string;
    adm1?: string;
    country?: string;
  }>;
}

/** 和风天气实时天气响应 */
interface QweatherNowResponse {
  code: string;
  updateTime?: string;
  now?: {
    obsTime?: string;
    temp?: string;
    feelsLike?: string;
    icon?: string;
    text?: string;
    wind360?: string;
    windDir?: string;
    windScale?: string;
    windSpeed?: string;
    humidity?: string;
    precip?: string;
    pressure?: string;
    vis?: string;
    cloud?: string;
    dew?: string;
  };
}

/** 和风天气 3 天预报响应 */
interface Qweather3dResponse {
  code: string;
  daily?: Array<{
    fxDate: string;
    tempMax?: string;
    tempMin?: string;
    iconDay?: string;
    iconNight?: string;
    textDay?: string;
    textNight?: string;
    wind360Day?: string;
    windDirDay?: string;
    windScaleDay?: string;
    windSpeedDay?: string;
    wind360Night?: string;
    windDirNight?: string;
    windScaleNight?: string;
    windSpeedNight?: string;
    sunrise?: string;
    sunset?: string;
    moonrise?: string;
    moonset?: string;
    moonPhase?: string;
    precip?: string;
    humidity?: string;
    pressure?: string;
    vis?: string;
    cloud?: string;
    uvIndex?: string;
  }>;
}

/** 和风天气空气质量响应 (新 API) */
interface QweatherAirResponse {
  metadata?: {
    tag?: string;
  };
  indexes?: Array<{
    code?: string;
    name?: string;
    aqi?: number;
    aqiDisplay?: string;
    level?: string;
    category?: string;
    primaryPollutant?: {
      code?: string;
      name?: string;
      fullName?: string;
    };
    health?: {
      effect?: string;
      advice?: {
        generalPopulation?: string;
        sensitivePopulation?: string;
      };
    };
  }>;
  pollutants?: Array<{
    code?: string;
    name?: string;
    fullName?: string;
    concentration?: {
      value?: number;
      unit?: string;
    };
  }>;
}

/** 和风天气生活指数响应 */
interface QweatherIndicesResponse {
  code: string;
  daily?: Array<{
    date?: string;
    type?: string;
    name?: string;
    level?: string;
    category?: string;
    text?: string;
  }>;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  private readonly CACHE_PREFIX = 'weather:';
  private readonly CACHE_VERSION = 'q2';
  private readonly CACHE_TTL_SEC = 30 * 60;
  private readonly L1_CACHE_TTL_MS = 60 * 1000;
  private readonly L1_CACHE_MAX_SIZE = 1000;
  private readonly TIMEOUT = 10_000;
  /** JWT 有效期 15 分钟，和风建议 iat=now-30s, exp=iat+900 */
  private readonly JWT_EXPIRES_SEC = 900;

  private readonly memoryCache = new Map<
    string,
    { data: WeatherData; expiresAt: number; lastAccessAt: number }
  >();

  constructor(private readonly redisService: RedisService) {}

  async getWeather(
    clientIp: string,
    location?: string,
    adm?: string,
    targetDate?: string,
  ): Promise<WeatherData> {
    const ip = this.normalizeIp(clientIp);
    const normalizedLocation = this.normalizeCity(location);
    const normalizedAdm = this.normalizeAdm(adm);
    const normalizedDate = this.normalizeTargetDate(targetDate);

    const cacheKey = `${this.CACHE_PREFIX}${this.CACHE_VERSION}:${
      normalizedLocation ? `loc:${normalizedLocation}` : ip
    }:${normalizedAdm ? `adm:${normalizedAdm}` : 'noadm'}:${normalizedDate || 'today'}`;

    const l1Cached = this.getFromMemoryCache(cacheKey);
    if (
      l1Cached &&
      !this.isInvalidWeatherData(l1Cached) &&
      !l1Cached.unavailable
    ) {
      return this.withWeatherPresentation(l1Cached);
    }

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached) as WeatherData;
        if (!this.isInvalidWeatherData(data) && !data.unavailable) {
          const normalized = this.withWeatherPresentation(data);
          this.setToMemoryCache(cacheKey, normalized);
          return normalized;
        }
      }
    } catch (err) {
      this.logger.warn(`Redis cache get failed: ${err}`);
    }

    const data = this.withWeatherPresentation(
      await this.fetchWeather(
        ip,
        normalizedLocation,
        normalizedAdm,
        normalizedDate,
      ),
    );

    // unavailable 或无效数据不缓存
    if (!this.isInvalidWeatherData(data) && !data.unavailable) {
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
    }

    return data;
  }

  getWeatherText(weatherCode: number, isDay: boolean): string {
    const normalizedCode = this.normalizeToSharedWeatherCode(
      weatherCode,
      isDay,
    );
    return WEATHER_CODE_MAP[normalizedCode]?.text ?? '未知';
  }

  getWeatherEmoji(weatherCode: number, isDay: boolean): string {
    const normalizedCode = this.normalizeToSharedWeatherCode(
      weatherCode,
      isDay,
    );
    return WEATHER_CODE_MAP[normalizedCode]?.emoji ?? '🌈';
  }

  private async fetchWeather(
    ip: string,
    locationName?: string,
    adm?: string,
    targetDate?: string,
  ): Promise<WeatherData> {
    const apiHost = process.env.QWEATHER_API_HOST;
    const privateKeyPem = process.env.QWEATHER_PRIVATE_KEY;
    const projectId = process.env.QWEATHER_PROJECT_ID;
    const keyId = process.env.QWEATHER_KEY_ID;

    if (!apiHost || !privateKeyPem || !projectId || !keyId) {
      this.logger.error(
        'Qweather config missing: QWEATHER_API_HOST, QWEATHER_PRIVATE_KEY, QWEATHER_PROJECT_ID, QWEATHER_KEY_ID are required',
      );
      return this.buildInvalidResult('北京', 39.9042, 116.4074, targetDate);
    }

    // 生成 JWT
    let jwt: string;
    try {
      jwt = this.generateJwt(keyId, projectId, privateKeyPem);
    } catch (err: unknown) {
      this.logger.error(`JWT generation failed: ${(err as Error).message}`);
      return this.buildInvalidResult('北京', 39.9042, 116.4074, targetDate);
    }

    let cityName = locationName || '未知城市';
    let lat = 39.9042;
    let lon = 116.4074;
    let fallbackInfo: WeatherData['fallback'] | undefined;

    // 1. 解析城市：直接通过和风地理 API 获取坐标（支持县区级）
    if (locationName) {
      const resolved = await this.resolveLocationId(
        apiHost,
        jwt,
        locationName,
        adm,
      );
      if (resolved) {
        cityName = resolved.name;
        lat = resolved.lat;
        lon = resolved.lon;
      } else {
        cityName = '北京';
        fallbackInfo = {
          isFallback: true,
          requestedCity: locationName,
          reason: 'city_not_resolved',
        };
      }
    } else {
      // 无城市参数：通过 IP 定位
      cityName = '北京';
      if (!this.isLocalIp(ip)) {
        const ipLoc = await this.resolveIpLocation(ip);
        if (ipLoc) {
          cityName = ipLoc.city;
          lat = ipLoc.lat;
          lon = ipLoc.lon;
        }
      }
    }

    // 和风天气支持直接用坐标查询：经度,纬度（不是纬度,经度），最多小数点后两位
    const coords = `${lon.toFixed(2)},${lat.toFixed(2)}`;

    // 2. 实时天气
    let temperature = 0;
    let weatherCode = 0;
    let isDay = true;
    let windspeed = 0;
    let humidity = 0;
    let precip = 0;

    try {
      const nowRes = await axios.get<QweatherNowResponse>(
        `https://${apiHost}/v7/weather/now`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Accept-Encoding': 'gzip',
          },
          params: { location: coords },
          timeout: this.TIMEOUT,
        },
      );
      if (nowRes.data?.code === '200' && nowRes.data.now) {
        const now = nowRes.data.now;
        temperature = Math.round(Number.parseInt(now.temp ?? '0', 10) || 0);
        weatherCode = Number.parseInt(now.icon ?? '0', 10) || 0;
        // iconDay/iconNight: 100=晴白天, 150=晴夜晚, 101=多云, ...
        isDay = Number.parseInt(now.icon ?? '100') < 200;
        windspeed = Math.round(Number.parseInt(now.windSpeed ?? '0', 10) || 0);
        humidity = Math.round(Number.parseInt(now.humidity ?? '0', 10) || 0);
        precip = Number.parseFloat(now.precip ?? '0') || 0;
      }
    } catch (err: unknown) {
      this.logger.warn(`Qweather now failed: ${(err as Error).message}`);
    }

    // 3. 3 天预报（用于最高/最低气温）
    let temperatureMax = 0;
    let temperatureMin = 0;

    try {
      const dailyRes = await axios.get<Qweather3dResponse>(
        `https://${apiHost}/v7/weather/3d`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Accept-Encoding': 'gzip',
          },
          params: { location: coords },
          timeout: this.TIMEOUT,
        },
      );
      if (dailyRes.data?.code === '200' && dailyRes.data.daily?.length) {
        const daily = dailyRes.data.daily;
        const targetDay =
          daily.find((d) => d.fxDate === targetDate) || daily[0];
        if (targetDay) {
          temperatureMax = Math.round(
            Number.parseInt(targetDay.tempMax ?? '0', 10) || 0,
          );
          temperatureMin = Math.round(
            Number.parseInt(targetDay.tempMin ?? '0', 10) || 0,
          );
          // 未来日期：用预报均温作为当前温
          if (targetDate && targetDate !== this.todayStr()) {
            temperature = Math.round((temperatureMax + temperatureMin) / 2);
            isDay = Number.parseInt(targetDay.iconDay ?? '100') < 200;
          }
        }
      }
    } catch (err: unknown) {
      this.logger.warn(`Qweather 3d failed: ${(err as Error).message}`);
    }

    const unavailable =
      this.isInvalidWeatherSnapshot(
        temperature,
        temperatureMax,
        temperatureMin,
        windspeed,
      ) || !!fallbackInfo;

    return {
      city: cityName,
      latitude: lat,
      longitude: lon,
      forecastDate: targetDate,
      temperature,
      temperatureMax,
      temperatureMin,
      weatherCode,
      weatherText: this.getWeatherText(weatherCode, isDay),
      weatherEmoji: this.getWeatherEmoji(weatherCode, isDay),
      isDay,
      windspeed,
      humidity,
      precip,
      unavailable,
      fallback: fallbackInfo,
    };
  }

  /**
   * 获取空气质量数据 (使用新 API)
   */
  async getAirQuality(
    clientIp: string,
    location?: string,
  ): Promise<AirQualityData | null> {
    const ip = this.normalizeIp(clientIp);
    const normalizedLocation = this.normalizeCity(location);

    let lat = 39.9042;
    let lon = 116.4074;

    // 如果提供了城市名，先解析坐标
    if (normalizedLocation) {
      const apiHost = process.env.QWEATHER_API_HOST;
      const privateKeyPem = process.env.QWEATHER_PRIVATE_KEY;
      const projectId = process.env.QWEATHER_PROJECT_ID;
      const keyId = process.env.QWEATHER_KEY_ID;

      if (apiHost && privateKeyPem && projectId && keyId) {
        try {
          const jwt = this.generateJwt(keyId, projectId, privateKeyPem);
          const resolved = await this.resolveLocationId(
            apiHost,
            jwt,
            normalizedLocation,
          );
          if (resolved) {
            lat = resolved.lat;
            lon = resolved.lon;
          }
        } catch {
          // 使用默认值
        }
      }
    } else if (!this.isLocalIp(ip)) {
      const ipLoc = await this.resolveIpLocation(ip);
      if (ipLoc) {
        lat = ipLoc.lat;
        lon = ipLoc.lon;
      }
    }

    const apiHost = process.env.QWEATHER_API_HOST;
    const privateKeyPem = process.env.QWEATHER_PRIVATE_KEY;
    const projectId = process.env.QWEATHER_PROJECT_ID;
    const keyId = process.env.QWEATHER_KEY_ID;

    if (!apiHost || !privateKeyPem || !projectId || !keyId) {
      this.logger.error('Qweather config missing for air quality');
      return null;
    }

    const jwt = this.generateJwt(keyId, projectId, privateKeyPem);

    // 使用新的空气质量 API
    try {
      const res = await axios.get<QweatherAirResponse>(
        `https://${apiHost}/airquality/v1/current/${lat.toFixed(2)}/${lon.toFixed(2)}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Accept-Encoding': 'gzip',
          },
          timeout: this.TIMEOUT,
        },
      );

      // 解析 indexes 数组，找到 US EPA AQI (常用标准)
      const indexes = res.data?.indexes ?? [];
      const usEpaIndex =
        indexes.find((idx) => idx?.code === 'us-epa') ?? indexes[0];

      if (usEpaIndex) {
        // 解析污染物浓度
        const pollutants = res.data?.pollutants ?? [];
        const getPollutantValue = (code: string): number => {
          const pollutant = pollutants.find((p) => p?.code === code);
          return pollutant?.concentration?.value ?? 0;
        };

        // 将 AQI 转换为等级描述
        const aqiValue = usEpaIndex.aqi ?? 0;
        const levelMap: Record<string, string> = {
          '1': '优',
          '2': '良',
          '3': '轻度污染',
          '4': '中度污染',
          '5': '重度污染',
          '6': '严重污染',
        };

        return {
          aqi: aqiValue,
          level:
            levelMap[usEpaIndex.level ?? ''] ?? usEpaIndex.category ?? '未知',
          category: usEpaIndex.category ?? 'Unknown',
          primaryPollutant: usEpaIndex.primaryPollutant?.name ?? '无',
          healthAdvice: usEpaIndex.health?.advice?.generalPopulation ?? '',
          sensitiveAdvice: usEpaIndex.health?.advice?.sensitivePopulation ?? '',
          pm2_5: getPollutantValue('pm2p5'),
          pm10: getPollutantValue('pm10'),
          no2: getPollutantValue('no2'),
          so2: getPollutantValue('so2'),
          co: getPollutantValue('co'),
          o3: getPollutantValue('o3'),
        };
      }
    } catch (err: unknown) {
      this.logger.warn(
        `Qweather air quality failed: ${(err as Error).message}`,
      );
    }

    return null;
  }

  /**
   * 获取天气生活指数
   */
  async getWeatherIndices(
    clientIp: string,
    location?: string,
  ): Promise<WeatherIndicesData | null> {
    const ip = this.normalizeIp(clientIp);
    const normalizedLocation = this.normalizeCity(location);

    let lat = 39.9042;
    let lon = 116.4074;

    if (normalizedLocation) {
      const apiHost = process.env.QWEATHER_API_HOST;
      const privateKeyPem = process.env.QWEATHER_PRIVATE_KEY;
      const projectId = process.env.QWEATHER_PROJECT_ID;
      const keyId = process.env.QWEATHER_KEY_ID;

      if (apiHost && privateKeyPem && projectId && keyId) {
        try {
          const jwt = this.generateJwt(keyId, projectId, privateKeyPem);
          const resolved = await this.resolveLocationId(
            apiHost,
            jwt,
            normalizedLocation,
          );
          if (resolved) {
            lat = resolved.lat;
            lon = resolved.lon;
          }
        } catch {
          // 使用默认值
        }
      }
    } else if (!this.isLocalIp(ip)) {
      const ipLoc = await this.resolveIpLocation(ip);
      if (ipLoc) {
        lat = ipLoc.lat;
        lon = ipLoc.lon;
      }
    }

    const apiHost = process.env.QWEATHER_API_HOST;
    const privateKeyPem = process.env.QWEATHER_PRIVATE_KEY;
    const projectId = process.env.QWEATHER_PROJECT_ID;
    const keyId = process.env.QWEATHER_KEY_ID;

    if (!apiHost || !privateKeyPem || !projectId || !keyId) {
      this.logger.error('Qweather config missing for indices');
      return null;
    }

    const jwt = this.generateJwt(keyId, projectId, privateKeyPem);
    const coords = `${lon.toFixed(2)},${lat.toFixed(2)}`;

    // 和风天气生活指数类型: 1=穿衣, 2=紫外线, 3=感冒, 5=洗车, 6=运动, 9=舒适度
    const indicesTypes = '1,2,3,5,6,9';

    try {
      const res = await axios.get<QweatherIndicesResponse>(
        `https://${apiHost}/v7/indices/1d`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Accept-Encoding': 'gzip',
          },
          params: { location: coords, type: indicesTypes },
          timeout: this.TIMEOUT,
        },
      );

      if (res.data?.code === '200' && res.data.daily?.length) {
        const indicesMap = new Map<string, { level: string; text: string }>();
        for (const item of res.data.daily) {
          if (item.type && item.name) {
            indicesMap.set(item.type, {
              level: item.category ?? item.level ?? '',
              text: item.text ?? '',
            });
          }
        }

        const dressing = indicesMap.get('1');
        const uv = indicesMap.get('2');
        const coldRisk = indicesMap.get('3');
        const carWashing = indicesMap.get('5');
        const sport = indicesMap.get('6');
        const comfort = indicesMap.get('9');

        return {
          dressingIndex: dressing?.text ?? '未知',
          dressingLevel: dressing?.level ?? '未知',
          uvIndex: uv?.text ?? '未知',
          carWashingIndex: carWashing?.text ?? '未知',
          coldRiskIndex: coldRisk?.text ?? '未知',
          comfortIndex: comfort?.text ?? '未知',
          sportIndex: sport?.text ?? '未知',
        };
      }
    } catch (err: unknown) {
      this.logger.warn(`Qweather indices failed: ${(err as Error).message}`);
    }

    return null;
  }

  /**
   * 生成和风天气 JWT Token（Ed25519 签名）
   * Header:  {"alg": "EdDSA", "kid": "<keyId>"}
   * Payload: {"sub": "<projectId>", "iat": unix_ts, "exp": unix_ts}
   */
  private generateJwt(
    keyId: string,
    projectId: string,
    privateKeyPem: string,
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const iat = now - 30; // 30 秒偏差容错
    const exp = iat + this.JWT_EXPIRES_SEC;

    const header = { alg: 'EdDSA', kid: keyId };
    const payload = { sub: projectId, iat, exp };

    const headerB64 = this.base64urlEncode(JSON.stringify(header));
    const payloadB64 = this.base64urlEncode(JSON.stringify(payload));
    const data = `${headerB64}.${payloadB64}`;

    const signature = this.ed25519Sign(data, privateKeyPem);
    const token = `${data}.${signature}`;

    return token;
  }

  private base64urlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private ed25519Sign(data: string, privateKeyPem: string): string {
    // 规范化 PEM：环境变量中的 \n 可能变成字面字符串；用户也可能只填了中间字符串
    let pem = privateKeyPem.replace(/\\n/g, '\n').trim();
    if (!pem.includes('-----BEGIN')) {
      pem = `-----BEGIN PRIVATE KEY-----\n${pem}\n-----END PRIVATE KEY-----`;
    }
    const key = createPrivateKey({ key: pem, format: 'pem' });
    // Ed25519: 首个参数传 null，由 key 的类型决定算法
    const signature = cryptoSign(null, Buffer.from(data), key);
    return signature
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /** 通过 ip-api.com 解析 IP 所属城市 */
  private async resolveIpLocation(
    ip: string,
  ): Promise<{ city: string; lat: number; lon: number } | null> {
    try {
      const res = await axios.get<{
        status: string;
        city?: string;
        lat?: number;
        lon?: number;
      }>(`http://ip-api.com/json/${ip}?fields=status,city,lat,lon&lang=zh-CN`, {
        timeout: this.TIMEOUT,
      });
      if (
        res.data?.status === 'success' &&
        res.data.city &&
        res.data.lat &&
        res.data.lon
      ) {
        return {
          city: res.data.city,
          lat: res.data.lat,
          lon: res.data.lon,
        };
      }
    } catch (err: unknown) {
      this.logger.warn(
        `IP geolocation failed for ${ip}: ${(err as Error).message}`,
      );
    }
    return null;
  }

  /** 通过和风地理 API 将城市名解析为坐标（支持县区级） */
  private async resolveLocationId(
    apiHost: string,
    jwt: string,
    location: string,
    adm?: string,
  ): Promise<{ name: string; lat: number; lon: number } | null> {
    try {
      const res = await axios.get<QweatherGeoResponse>(
        `https://${apiHost}/geo/v2/city/lookup`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Accept-Encoding': 'gzip',
          },
          params: { location, adm, range: 'cn', number: 5 },
          timeout: this.TIMEOUT,
        },
      );
      if (res.data?.code === '200' && res.data.location?.length) {
        const best = res.data.location[0];
        return {
          name: best.name,
          lat: Number.parseFloat(best.lat),
          lon: Number.parseFloat(best.lon),
        };
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: unknown };
        message: string;
      };
      this.logger.warn(
        'Qweather geo lookup failed for "' +
          location +
          '": HTTP ' +
          (axiosErr.response?.status ?? 'unknown') +
          ', ' +
          axiosErr.message,
      );
    }

    // 和风地理 API 失败时，尝试 Nominatim 作为备用
    return this.resolveCityByNominatim(location);
  }

  /** Nominatim 地理编码备用方案 */
  private async resolveCityByNominatim(
    city: string,
  ): Promise<{ name: string; lat: number; lon: number } | null> {
    try {
      const res = await axios.get<{
        display_name?: string;
        lat?: string;
        lon?: string;
        address?: {
          city?: string;
          county?: string;
          district?: string;
          state?: string;
        };
      }>('https://nominatim.openstreetmap.org/search', {
        params: {
          q: city + ',中国',
          format: 'json',
          limit: 1,
          addressdetails: 1,
        },
        headers: {
          'Accept-Encoding': 'gzip',
          'User-Agent': 'Mozilla/5.0 (compatible; AbnerBlog/1.0)',
        },
        timeout: this.TIMEOUT,
      });
      if (res.data?.lat && res.data?.lon) {
        const address = res.data.address;
        const displayCity =
          address?.city || address?.county || address?.district || city;
        return {
          name: displayCity,
          lat: Number.parseFloat(res.data.lat),
          lon: Number.parseFloat(res.data.lon),
        };
      }
    } catch (err: unknown) {
      this.logger.warn(
        'Nominatim geo lookup failed for "' +
          city +
          '": ' +
          ((err as { message: string }).message ?? 'unknown'),
      );
    }
    return null;
  }

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private normalizeIp(ip: string): string {
    return ip?.replace(/^::ffff:/, '') || 'unknown';
  }

  private normalizeCity(city?: string): string | undefined {
    const normalized = city?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeAdm(adm?: string): string | undefined {
    const normalized = adm?.trim();
    return normalized ? normalized : undefined;
  }

  private normalizeTargetDate(targetDate?: string): string | undefined {
    const text = targetDate?.trim();
    if (!text) return undefined;
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? text : undefined;
  }

  private buildInvalidResult(
    city: string,
    lat: number,
    lon: number,
    targetDate?: string,
  ): WeatherData {
    return {
      city,
      latitude: lat,
      longitude: lon,
      forecastDate: targetDate,
      temperature: 0,
      temperatureMax: 0,
      temperatureMin: 0,
      weatherCode: 0,
      weatherText: this.getWeatherText(0, true),
      weatherEmoji: this.getWeatherEmoji(0, true),
      isDay: true,
      windspeed: 0,
      humidity: 0,
      precip: 0,
      unavailable: true,
    };
  }

  private getFromMemoryCache(cacheKey: string): WeatherData | null {
    const now = Date.now();
    const entry = this.memoryCache.get(cacheKey);
    if (!entry) return null;
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

  private withWeatherPresentation(data: WeatherData): WeatherData {
    return {
      ...data,
      weatherText:
        data.weatherText ?? this.getWeatherText(data.weatherCode, data.isDay),
      weatherEmoji:
        data.weatherEmoji ?? this.getWeatherEmoji(data.weatherCode, data.isDay),
    };
  }

  private normalizeToSharedWeatherCode(
    weatherCode: number,
    isDay: boolean,
  ): number {
    // 已是共享码表（前端同款）时直接返回
    if (WEATHER_CODE_MAP[weatherCode]) return weatherCode;

    // 和风 icon 码转换到共享码表（近似映射）
    if (weatherCode === 100) return isDay ? 0 : 1;
    if (weatherCode === 150) return 1;
    if (weatherCode === 101) return 1;
    if (weatherCode === 102) return 2;
    if (weatherCode === 103) return 2;
    if (weatherCode === 104) return 3;
    if (weatherCode >= 300 && weatherCode < 400) return 61;
    if (weatherCode >= 400 && weatherCode < 500) return 71;
    if (weatherCode >= 500 && weatherCode < 600) return 45;
    if (weatherCode >= 900) return 95;
    return weatherCode;
  }
}
