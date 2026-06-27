/**
 * MCP Tool Factory
 *
 * 根据用户启用的 MCP Server 动态生成 LangGraph 工具列表。
 * 每个用户的工具集不同 — 基于 active MCP 服务器的 allowedTools。
 */

import { DynamicTool } from '@langchain/core/tools';
import type { MCPServersService } from '../../../../mcp/services/mcp-servers.service';
import { Logger } from '@nestjs/common';

/**
 * 内置 MCP 工具的描述映射（来自已知的工具定义）
 * 远程 MCP 工具无法获取详细描述，统一用通用描述
 */
const BUILTIN_TOOL_DESCRIPTIONS: Record<string, string> = {
  search:
    '执行联网搜索，获取新闻/资讯/网页信息，返回搜索摘要。当用户询问最新消息、实时信息或需要查资料时使用。参数：query（搜索关键词）',
  get_user_info: '获取当前登录用户的基本信息（昵称、邮箱、角色、头像等）。无需参数。仅当用户明确询问"我的信息""我的账号""我是谁"等个人信息时使用，不要因为其他问题调用此工具。',
  get_weather:
    '查询实时天气预报（气温、降水、风力、空气质量等）。当用户询问天气、气温、降雨、台风、空气质量等情况时使用。参数：city（城市名，必填）、date（可选日期，格式 YYYY-MM-DD）',
  weather:
    '⚠️ 此名称已弃用，请使用 get_weather',
  get_air_quality:
    '查询空气质量指数（AQI）、PM2.5、PM10、臭氧等数据。当用户询问空气质量、雾霾、空气污染时使用。参数：city（城市名）',
  list_issues: '列出用户 GitHub 仓库的 Issue 列表。仅当用户明确询问"我的 issue""仓库 issue"等 GitHub Issue 相关问题时使用。',
  list_prs: '列出用户 GitHub 仓库的 Pull Request 列表。仅当用户明确询问"我的 PR""Pull Request"等 GitHub PR 相关问题时使用。',
  get_repo: '获取用户 GitHub 仓库的详细信息。仅当用户明确询问"我的仓库""代码仓库"等 GitHub 仓库相关信息时使用。',
  create_issue: '在 GitHub 仓库创建 Issue。仅当用户明确要求创建 Issue 时使用。参数：title（标题，必填）、body（正文，可选）',
  create_pr: '在 GitHub 仓库创建 Pull Request。仅当用户明确要求创建 PR 时使用。参数：title（标题，必填）、body（正文，可选）、headBranch（源分支，必填）、baseBranch（目标分支，必填）',
  get_page_content: '获取指定 URL 网页的完整内容。仅当需要获取网页正文全文进行深度分析时使用。参数：url（网页地址，必填）',
  create_todo: '创建待办事项。仅当用户说"添加待办""创建任务""提醒我"等时使用。参数：title（标题，必填）、dueDate（截止日期，ISO字符串，可选）',
  update_todo: '更新待办事项。仅当用户说"修改待办""更新任务""完成待办"等时使用。参数：id（待办ID，必填）、title（新标题，可选）、completed（是否完成，可选）',
  delete_todo: '删除待办事项。仅当用户说"删除待办""移除任务"等时使用。参数：id（待办ID，必填）或 title（标题）',
  list_todos: '列出所有待办事项。仅当用户说"查看待办""我的任务""有什么待办"等时使用。无需参数。',
  create_event: '创建日程事件。仅当用户说"添加日程""创建事件""安排会议"等时使用。参数：title（标题，必填）、startTime（开始时间，ISO字符串，必填）、endTime（结束时间，ISO字符串，可选）、allDay（是否为全天事件，可选）、location（地点，可选）',
  update_event: '更新日程事件。仅当用户说"修改日程""改时间"等时使用。参数：id（日程ID，必填）、title（新标题，可选）、startTime（开始时间，可选）、endTime（结束时间，可选）',
  delete_event: '删除日程事件。仅当用户说"取消日程""删除事件"等时使用。参数：id（日程ID，必填）或 title（标题）',
  list_events: '列出用户的日程事件。当用户询问"我的日程""今天日程""本月安排"等时使用。参数：startDate（开始日期，可选）、endDate（结束日期，可选）',
};

/**
 * 为 MCP 工具生成描述文本
 */
function describeMcpTool(
  toolName: string,
  serverName: string,
  _serverType: string,
): string {
  const known = BUILTIN_TOOL_DESCRIPTIONS[toolName];
  if (known) {
    return `[${serverName}] ${known}`;
  }
  const typeLabel = _serverType === 'builtin' ? '内置' : '远程';
  return `[${typeLabel}/${serverName}] ${toolName} 工具。仅当用户明确提到与此工具相关的内容时使用，不要随意调用。`;
}

/**
 * 根据用户已启用的 MCP 服务器动态创建 MCP 工具列表
 *
 * @param mcpServersService - MCP 服务实例
 * @param userId - 当前用户 ID
 * @returns DynamicTool 数组（无可用工具时返回空数组）
 */
export async function createDynamicMcpTools(
  mcpServersService: MCPServersService,
  userId: number,
): Promise<DynamicTool[]> {
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
      ([toolName, serverInfo]) =>
        new DynamicTool({
          name: toolName,
          description: describeMcpTool(
            toolName,
            serverInfo.name,
            serverInfo.type,
          ),
          func: async (input: string) => {
            let params: Record<string, unknown>;
            try {
              params = JSON.parse(input);
            } catch {
              // 如果非 JSON，尝试作为简单查询参数
              params = { query: input };
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
        }),
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`userId=${userId} failed to load MCP tools: ${msg}`);
    return [];
  }
}
