import { z } from 'zod';

/** 获取天气参数 */
export const GetWeatherSchema = z.object({
  city: z.string().describe('城市名称，如"北京"、"上海"、"深圳"'),
  date: z
    .string()
    .optional()
    .describe('查询日期，格式为 YYYY-MM-DD，如 "2026-04-08"，默认查询今天'),
});

export type GetWeatherInput = z.infer<typeof GetWeatherSchema>;

/** 获取空气质量参数 */
export const GetAirQualitySchema = z.object({
  city: z.string().describe('城市名称，如"北京"、"上海"、"深圳"'),
});

export type GetAirQualityInput = z.infer<typeof GetAirQualitySchema>;

/** 获取天气生活指数参数 */
export const GetWeatherIndicesSchema = z.object({
  city: z.string().describe('城市名称，如"北京"、"上海"、"深圳"'),
});

export type GetWeatherIndicesInput = z.infer<typeof GetWeatherIndicesSchema>;
