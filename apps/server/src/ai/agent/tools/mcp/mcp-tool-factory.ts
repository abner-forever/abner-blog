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
  get_user_info: '获取当前登录用户的基本信息（昵称、邮箱、角色、头像等）',
  weather:
    '查询实时天气预报（气温、降水、风力、空气质量等）。参数：city（城市名）、date（可选日期）',
  list_issues: '列出 GitHub 仓库的 Issue 列表',
  list_prs: '列出 GitHub 仓库的 Pull Request 列表',
  get_repo: '获取 GitHub 仓库的详细信息',
  create_issue: '在 GitHub 仓库创建 Issue',
  create_todo: '[MCP] 创建待办事项',
  update_todo: '[MCP] 更新待办事项',
  delete_todo: '[MCP] 删除待办事项',
  list_todos: '[MCP] 列出所有待办事项',
  create_event: '[MCP] 创建日程事件',
  update_event: '[MCP] 更新日程事件',
  delete_event: '[MCP] 删除日程事件',
  list_events: '[MCP] 列出日程事件',
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
  return `[${typeLabel}/${serverName}] 调用 MCP 工具 "${toolName}"。注意：这是一个${typeLabel}服务器工具，具体功能由其提供方定义。`;
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
