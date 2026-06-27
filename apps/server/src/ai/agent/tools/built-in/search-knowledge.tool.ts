/**
 * search_knowledge 工具
 *
 * 搜索用户知识库进行 RAG 检索。
 * 在 Preprocess Node 已自动注入高相关度上下文的基础上，此工具供 LLM 按需进行深度搜索。
 */

import { tool, type DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import type { KnowledgeBaseService } from '../../../../knowledge-base/knowledge-base.service';

/** search_knowledge 工具参数 schema */
const searchKnowledgeSchema = z.object({
  query: z.string().describe('知识库搜索查询词'),
  topK: z.number().optional().default(3).describe('返回结果数量（默认 3）'),
});

/**
 * 创建 search_knowledge 工具
 *
 * 此工具用于 LLM 在对话中按需搜索知识库（"让我查一下知识库中的相关信息"）。
 * 高相关度内容已在 Preprocess Node 自动注入 state 中。
 */
export function createSearchKnowledgeTool(
  knowledgeBaseService: KnowledgeBaseService,
  userId: number,
): DynamicStructuredTool {
  return tool(
    async ({ query, topK }: z.infer<typeof searchKnowledgeSchema>) => {
      try {
        if (!userId) {
          return JSON.stringify({
            status: 'error',
            error: '游客无法使用知识库搜索',
          });
        }

        const results = await knowledgeBaseService.search(
          { query, topK: topK ?? 3 },
          userId,
        );

        if (!results || results.length === 0) {
          return JSON.stringify({
            status: 'success',
            content: '知识库中未找到相关信息',
            results: [],
          });
        }

        const formatted = results.map(
          (r, i) =>
            `[${i + 1}] ${r.content}${r.score ? ` (相关度: ${(r.score * 100).toFixed(0)}%)` : ''}`,
        );

        return JSON.stringify({
          status: 'success',
          content: formatted.join('\n\n'),
          results: results.map((r) => ({
            content: r.content,
            score: r.score,
          })),
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return JSON.stringify({
          status: 'error',
          error: `知识库搜索失败: ${msg}`,
        });
      }
    },
    {
      name: 'search_knowledge',
      description:
        '搜索用户的知识库，获取已有文档中的相关信息。当用户询问个人知识库中的内容时使用。注意：高相关度知识已在上下文中自动注入。',
      schema: searchKnowledgeSchema,
    },
  );
}
