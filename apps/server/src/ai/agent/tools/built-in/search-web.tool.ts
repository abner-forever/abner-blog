/**
 * search_web 工具
 *
 * 联网搜索获取最新信息。
 * 降级链：MCP search → WebSearchService（Tavily / Brave）。
 */

import { tool, type DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import type { MCPServersService } from '../../../../mcp';
import { WebSearchService } from '../../../../web-search/web-search.service';

/** search_web 工具参数 schema */
const searchWebSchema = z.object({
  query: z.string().describe('搜索查询词，简洁准确的关键词组合'),
});

/**
 * 创建 search_web 工具
 *
 * 降级链：MCP search tool → WebSearchService.searchDigest → 错误信息
 */
export function createSearchWebTool(
  mcpServersService: MCPServersService,
  webSearchService: WebSearchService,
  userId: number,
): DynamicStructuredTool {
  return tool(
    async ({ query }: z.infer<typeof searchWebSchema>) => {
      try {
        // MCP 优先
        try {
          const mcpResult = await mcpServersService.callToolForUser(
            userId,
            'search',
            { query },
          );
          const first = mcpResult.content.find(
            (item) => item.type === 'text',
          );
          const text = first?.text?.trim();
          if (text) {
            return JSON.stringify({
              status: 'success',
              content: text,
              source: 'mcp',
            });
          }
        } catch {
          // MCP 失败 → 降级到 Direct WebSearchService
        }

        // Direct API fallback
        const digest = await webSearchService.searchDigest(query);
        if (digest?.trim()) {
          return JSON.stringify({
            status: 'success',
            content: digest,
            source: 'direct',
          });
        }

        return JSON.stringify({
          status: 'success',
          content: '搜索未返回结果',
          source: 'direct',
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          status: 'error',
          error: `联网搜索失败: ${msg}`,
        });
      }
    },
    {
      name: 'search_web',
      description:
        '联网搜索获取最新信息，如新闻、实时数据、知识问答等。当用户询问新闻、实时信息、或者不确定的知识时使用。参数 query 应简洁准确。',
      schema: searchWebSchema,
    },
  );
}
