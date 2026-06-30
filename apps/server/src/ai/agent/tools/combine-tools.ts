/**
 * combineTools — 合并 Built-in 和 MCP 工具为统一的 ToolConfig 列表
 */

import type { DynamicStructuredTool } from '@langchain/core/tools';
import { type ToolConfig } from '../workflow/state';

/**
 * 合并 Built-in 和 MCP 工具为统一的 ToolConfig 列表
 *
 * @param builtInTools - 预定义的 StructuredTool 数组
 * @param mcpTools - 动态注入的 DynamicStructuredTool 数组
 * @returns ToolConfig 数组
 */
export function combineTools(
  builtInTools: DynamicStructuredTool[],
  mcpTools: DynamicStructuredTool[],
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
