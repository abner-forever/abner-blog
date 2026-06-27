/**
 * query_weather 工具
 *
 * 查询指定城市的天气、空气质量、生活指数。
 * 降级链：MCP weather → AIWeatherService
 */

import { tool, type DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import type { ChatLLM } from '../../../langchain/model';
import type { MCPServersService } from '../../../../mcp';
import { AIWeatherService } from '../../../services/ai-weather.service';

/** query_weather 工具参数 schema */
const queryWeatherSchema = z.object({
  city: z.string().describe('城市名称，例如：北京、上海、广州'),
  adm: z
    .string()
    .optional()
    .describe('行政区划（省/自治区，可选，帮助精确定位）'),
  date: z
    .string()
    .optional()
    .describe('日期（可选，默认今天，格式：2026-06-26 或 "明天"、"后天"）'),
});

/**
 * 创建 query_weather 工具
 *
 * 降级链：MCP weather（结构化数据 + LLM 合成）→ AIWeatherService
 */
export function createQueryWeatherTool(
  weatherService: AIWeatherService,
  mcpServersService: MCPServersService,
  llm: ChatLLM,
  userId: number,
  currentDate: string,
): DynamicStructuredTool {
  return tool(
    async ({ city, adm, date }: z.infer<typeof queryWeatherSchema>) => {
      try {
        const messageText = date
          ? `${city}${date}天气怎么样`
          : `${city}天气怎么样`;

        // 尝试 MCP 天气工具优先
        try {
          const mcpResult = await mcpServersService.callToolForUser(
            userId,
            'weather',
            { city, adm: adm ?? city, date: date ?? currentDate },
          );
          const first = mcpResult.content.find(
            (item) => item.type === 'text',
          );
          const mcpText = first?.text?.trim();
          if (mcpText) {
            // MCP 天气是结构化事实，用 LLM 合成自然语言回复
            const composed = await weatherService.composeMcpWeatherUserReply(
              llm,
              messageText,
              mcpText,
            );
            return JSON.stringify({
              status: 'success',
              type: 'chat',
              content: composed,
              source: 'mcp',
            });
          }
        } catch {
          // MCP 失败 → 降级到 Direct WeatherService
        }

        // Direct WeatherService path
        const weatherReply = await weatherService.buildWeatherResponse(
          llm,
          messageText,
          currentDate,
        );
        return JSON.stringify({
          status: 'success',
          type: 'chat',
          content: weatherReply,
          source: 'direct',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          status: 'error',
          error: `天气查询失败: ${msg}`,
        });
      }
    },
    {
      name: 'query_weather',
      description:
        '查询指定城市的天气、气温、降雨、风力、空气质量等信息。支持指定日期和省份/行政区划。例如：北京明天天气、上海空气质量。',
      schema: queryWeatherSchema,
    },
  );
}
