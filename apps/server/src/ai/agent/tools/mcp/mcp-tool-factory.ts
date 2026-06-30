/**
 * MCP Tool Factory
 *
 * 根据用户启用的 MCP Server 动态生成 LangGraph 工具列表。
 * 每个用户的工具集不同 — 基于 active MCP 服务器的 allowedTools。
 *
 * 使用 DynamicStructuredTool + Zod schema 确保 LLM 正确传递参数。
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod/v3';
import type { MCPServersService } from '../../../../mcp/services/mcp-servers.service';
import { Logger } from '@nestjs/common';

/**
 * 内置 MCP 工具的描述和 schema 映射
 * 远程 MCP 工具无法获取详细描述，统一用通用描述
 */
const BUILTIN_TOOL_SCHEMAS: Record<
  string,
  { description: string; schema: z.ZodObject<z.ZodRawShape> }
> = {
  search: {
    description:
      '执行联网搜索，获取新闻/资讯/网页信息，返回搜索摘要。当用户询问最新消息、实时信息或需要查资料时使用。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
    }),
  },
  get_user_info: {
    description:
      '获取当前登录用户的基本信息（昵称、邮箱、角色、头像等）。当用户询问个人信息、账号信息、用户资料、查询/查看我的信息、或"我是谁"等涉及获取自身信息时使用。',
    schema: z.object({}),
  },
  get_weather: {
    description:
      '查询实时天气预报（气温、降水、风力、空气质量等）。当用户询问天气、气温、降雨、台风、空气质量等情况时使用。',
    schema: z.object({
      city: z.string().describe('城市名，例如：北京、上海、广州'),
      date: z.string().optional().describe('日期，格式 YYYY-MM-DD，默认今天'),
    }),
  },
  get_air_quality: {
    description:
      '查询空气质量指数（AQI）、PM2.5、PM10、臭氧等数据。当用户询问空气质量、雾霾、空气污染时使用。',
    schema: z.object({
      city: z.string().describe('城市名'),
    }),
  },
  list_issues: {
    description:
      '列出用户 GitHub 仓库的 Issue 列表。仅当用户明确询问"我的 issue""仓库 issue"等 GitHub Issue 相关问题时使用。',
    schema: z.object({}),
  },
  list_prs: {
    description:
      '列出用户 GitHub 仓库的 Pull Request 列表。仅当用户明确询问"我的 PR""Pull Request"等 GitHub PR 相关问题时使用。',
    schema: z.object({}),
  },
  get_repo: {
    description:
      '获取用户 GitHub 仓库的详细信息。仅当用户明确询问"我的仓库""代码仓库"等 GitHub 仓库相关信息时使用。',
    schema: z.object({}),
  },
  create_issue: {
    description:
      '在 GitHub 仓库创建 Issue。仅当用户明确要求创建 Issue 时使用。',
    schema: z.object({
      title: z.string().describe('Issue 标题'),
      body: z.string().optional().describe('Issue 正文'),
    }),
  },
  create_pr: {
    description:
      '在 GitHub 仓库创建 Pull Request。仅当用户明确要求创建 PR 时使用。',
    schema: z.object({
      title: z.string().describe('PR 标题'),
      body: z.string().optional().describe('PR 正文'),
      headBranch: z.string().describe('源分支'),
      baseBranch: z.string().describe('目标分支'),
    }),
  },
  get_page_content: {
    description:
      '获取指定 URL 网页的完整内容。仅当需要获取网页正文全文进行深度分析时使用。',
    schema: z.object({
      url: z.string().describe('网页地址'),
    }),
  },
  create_todo: {
    description:
      '创建待办事项。仅当用户说"添加待办""创建任务""提醒我"等时使用。',
    schema: z.object({
      title: z.string().describe('待办标题'),
      description: z.string().optional().describe('待办详细描述'),
    }),
  },
  update_todo: {
    description:
      '更新待办事项。仅当用户说"修改待办""更新任务""完成待办"等时使用。',
    schema: z.object({
      id: z.number().describe('待办 ID'),
      title: z.string().optional().describe('新标题'),
      description: z.string().optional().describe('新的描述'),
      completed: z.boolean().optional().describe('是否完成'),
    }),
  },
  delete_todo: {
    description: '删除待办事项。仅当用户说"删除待办""移除任务"等时使用。',
    schema: z.object({
      id: z.number().describe('待办 ID'),
    }),
  },
  list_todos: {
    description:
      '列出所有待办事项。仅当用户说"查看待办""我的任务""有什么待办"等时使用。',
    schema: z.object({
      completed: z
        .boolean()
        .optional()
        .describe('筛选已完成/未完成的待办，不传则返回全部'),
    }),
  },
  create_event: {
    description:
      '创建日程事件。仅当用户说"添加日程""创建事件""安排会议"等时使用。',
    schema: z.object({
      title: z.string().describe('日程标题'),
      startDate: z.string().describe('开始时间，ISO 8601 格式'),
      endDate: z.string().optional().describe('结束时间，ISO 8601 格式'),
      allDay: z.boolean().optional().describe('是否为全天事件'),
      location: z.string().optional().describe('地点'),
    }),
  },
  update_event: {
    description: '更新日程事件。仅当用户说"修改日程""改时间"等时使用。',
    schema: z.object({
      id: z.number().describe('日程 ID'),
      title: z.string().optional().describe('新标题'),
      startDate: z.string().optional().describe('开始时间，ISO 8601 格式'),
      endDate: z.string().optional().describe('结束时间，ISO 8601 格式'),
    }),
  },
  delete_event: {
    description: '删除日程事件。仅当用户说"取消日程""删除事件"等时使用。',
    schema: z.object({
      id: z.number().describe('日程 ID'),
    }),
  },
  list_events: {
    description:
      '列出用户的日程事件。当用户说"所有日程""全部日程""查询日程""查看日程"时不要传日期参数以展示全部（含历史+未来）。仅当用户明确指定日期范围（如"今天""本周""本月""下个月"）时才传startDate/endDate。',
    schema: z.object({
      startDate: z
        .string()
        .optional()
        .describe('筛选起始日期（含），不传则从最早的事件开始'),
      endDate: z
        .string()
        .optional()
        .describe('筛选结束日期（含），不传则截止到最晚的事件'),
    }),
  },
};

/**
 * 为未知 MCP 工具生成通用 schema（接受任意 JSON 对象）
 */
function createGenericSchema(): z.ZodObject<z.ZodRawShape> {
  return z.object({
    params: z
      .string()
      .optional()
      .describe('JSON 格式的参数字符串，例如：{"key": "value"}'),
  });
}

/**
 * 为 MCP 工具生成描述文本
 */
function describeMcpTool(
  toolName: string,
  serverName: string,
  _serverType: string,
): string {
  const known = BUILTIN_TOOL_SCHEMAS[toolName];
  if (known) {
    return `[${serverName}] ${known.description}`;
  }
  const typeLabel = _serverType === 'builtin' ? '内置' : '远程';
  return `[${typeLabel}/${serverName}] ${toolName} 工具。仅当用户明确提到与此工具相关的内容时使用，不要随意调用。`;
}

/**
 * 获取工具的 schema
 */
function getToolSchema(toolName: string): z.ZodObject<z.ZodRawShape> {
  const known = BUILTIN_TOOL_SCHEMAS[toolName];
  return known?.schema || createGenericSchema();
}

/**
 * 根据用户已启用的 MCP 服务器动态创建 MCP 工具列表
 *
 * @param mcpServersService - MCP 服务实例
 * @param userId - 当前用户 ID
 * @returns DynamicStructuredTool 数组（无可用工具时返回空数组）
 */
export async function createDynamicMcpTools(
  mcpServersService: MCPServersService,
  userId: number,
): Promise<DynamicStructuredTool[]> {
  const logger = new Logger('McpToolFactory');

  try {
    // 获取用户所有 MCP 服务器
    const servers = await mcpServersService.findAll(userId);

    // 只取 active 的服务器
    const activeServers = servers.filter((s) => s.status === 'active');

    if (activeServers.length === 0) {
      logger.log(`userId=${userId} no active MCP servers found`);
      return [];
    }

    // 收集所有 allowedTools (去重)
    const toolNameToServer = new Map<string, { name: string; type: string }>();
    for (const server of activeServers) {
      for (const toolName of server.allowedTools || []) {
        if (!toolNameToServer.has(toolName)) {
          toolNameToServer.set(toolName, {
            name: server.name,
            type: server.type,
          });
        }
      }
    }

    if (toolNameToServer.size === 0) {
      logger.log(`userId=${userId} active servers have no allowed tools`);
      return [];
    }

    logger.log(
      `userId=${userId} injecting ${toolNameToServer.size} MCP tools: [${Array.from(toolNameToServer.keys()).join(', ')}]`,
    );

    return Array.from(toolNameToServer.entries()).map(
      ([toolName, serverInfo]) => {
        const schema = getToolSchema(toolName);

        return new DynamicStructuredTool({
          name: toolName,
          description: describeMcpTool(
            toolName,
            serverInfo.name,
            serverInfo.type,
          ),
          schema,
          func: async (args: Record<string, unknown>) => {
            // 对于通用 schema，解析 params 字符串
            let params: Record<string, unknown>;
            if (args.params && typeof args.params === 'string') {
              try {
                params = JSON.parse(args.params) as Record<string, unknown>;
              } catch {
                params = { query: args.params };
              }
            } else {
              params = args;
            }

            const result = await mcpServersService.callToolForUser(
              userId,
              toolName,
              params,
            );

            const textItems = result.content.filter((c) => c.type === 'text');
            const text = textItems.map((c) => c.text).join('\n');

            if (result.structuredContent) {
              return JSON.stringify({
                status: 'success',
                content: text,
                structuredContent: result.structuredContent,
              });
            }

            return (
              text || JSON.stringify({ status: 'success', content: '操作完成' })
            );
          },
        });
      },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`userId=${userId} failed to load MCP tools: ${msg}`);
    return [];
  }
}
