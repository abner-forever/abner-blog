/**
 * Tools 统一入口
 *
 * 组合 Built-in 工具 + 动态 MCP 工具。
 * 每个请求在 Preprocess Node 中调用此函数生成完整的工具列表。
 */

import type { DynamicTool, DynamicStructuredTool } from '@langchain/core/tools';
import { type ToolConfig } from '../workflow/state';

/**
 * 合并 Built-in 和 MCP 工具为统一的 ToolConfig 列表
 *
 * @param builtInTools - 预定义的 StructuredTool 数组
 * @param mcpTools - 动态注入的 DynamicTool 数组
 * @returns ToolConfig 数组
 */
export function combineTools(
  builtInTools: DynamicStructuredTool[],
  mcpTools: DynamicTool[],
): ToolConfig[] {
  const allTools: ToolConfig[] = [];

  // Built-in 工具优先（保证优先级）
  for (const tool of builtInTools) {
    allTools.push({
      name: tool.name,
      description: tool.description,
      tool,
    });
  }

  // MCP 工具（去重：忽略与 built-in 同名的）
  const builtInNames = new Set(builtInTools.map((t) => t.name));
  for (const tool of mcpTools) {
    if (!builtInNames.has(tool.name)) {
      allTools.push({
        name: tool.name,
        description: tool.description,
        tool,
      });
    }
  }

  return allTools;
}

export {
  createManageTodosTool,
} from './built-in/manage-todos.tool';
export {
  createManageEventsTool,
} from './built-in/manage-events.tool';
export {
  createQueryWeatherTool,
} from './built-in/query-weather.tool';
export {
  createSearchWebTool,
} from './built-in/search-web.tool';
export {
  createSearchKnowledgeTool,
} from './built-in/search-knowledge.tool';
export {
  createDynamicMcpTools,
} from './mcp/mcp-tool-factory';
