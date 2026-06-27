/**
 * Preprocess Node
 *
 * 工作流预处理节点（单次执行）：
 * 1. 构建 SystemPrompt（含 Skills）
 * 2. 加载会话历史 + 用户消息
 * 3. 自动查询 KB → 注入上下文
 * 4. 可选自动 WebSearch
 * 5. 构建可用工具列表
 */

import { SystemMessage } from '@langchain/core/messages';
import type { AgentStateType } from '../state';
import { DEFAULT_CONTEXT_WINDOW } from '../state';
import { combineTools, createDynamicMcpTools } from '../../tools';
import { createManageTodosTool } from '../../tools/built-in/manage-todos.tool';
import { createManageEventsTool } from '../../tools/built-in/manage-events.tool';
import { createQueryWeatherTool } from '../../tools/built-in/query-weather.tool';
import { createSearchWebTool } from '../../tools/built-in/search-web.tool';
import { createSearchKnowledgeTool } from '../../tools/built-in/search-knowledge.tool';
import type { WorkflowDeps } from '../workflow';
import { buildChatHumanMessage } from '../../../utils/build-chat-human-message';
import { shouldOfferWebSearchMcp } from '../../../utils/web-search-mcp-trigger';

/**
 * 创建预处理节点
 */
export function createPreprocessNode(deps: WorkflowDeps) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const {
      userInput,
      userId,
      sessionId,
      currentDate,
      contextWindow,
      streamChannel,
    } = state;

    const effectiveContextWindow = contextWindow || DEFAULT_CONTEXT_WINDOW;

    // ── 1. 加载会话历史 ──
    const sessionKey = deps.chatSessionService.getSessionKey(
      userId || undefined,
      sessionId,
    );
    const history = deps.chatSessionService.getHistoryMessages(sessionKey);
    const scopedHistory = deps.chatHistoryService.sliceHistoryForContext(
      history,
      effectiveContextWindow,
    );

    // ── 2. 构建用户 HumanMessage ──
    const userHuman = buildChatHumanMessage(userInput, deps.images);

    // ── 3. 自动查询 KB  ──
    let knowledgeContext: string | null = null;
    if (userId) {
      try {
        const kbResults = await deps.knowledgeBaseService.search(
          { query: userInput, topK: 3 },
          userId,
        );
        if (kbResults.length > 0) {
          const parts = kbResults.map(
            (r, i) => `[知识库${i + 1}] ${r.content}`,
          );
          knowledgeContext = `以下是知识库中相关信息，请结合回答：\n${parts.join('\n')}`;
        }
      } catch {
        // KB 搜索失败，跳过
      }
    }

    // ── 4. 可选自动 WebSearch ──
    let webSearchContext: string | null = null;
    if (shouldOfferWebSearchMcp(userInput) && userId) {
      streamChannel.emit({
        event: 'web_search_status',
        payload: { status: 'searching' },
      });

      try {
        // MCP search 优先，失败降级到 Direct API
        try {
          const mcpResult = await deps.mcpServersService.callToolForUser(
            userId,
            'search',
            { query: userInput },
          );
          const first = mcpResult.content.find((c) => c.type === 'text');
          if (first?.text?.trim()) {
            webSearchContext = first.text.trim();
          }
        } catch {
          // MCP fallback → direct API
        }

        if (!webSearchContext) {
          const digest = await deps.webSearchService.searchDigest(userInput);
          if (digest?.trim()) {
            webSearchContext = digest;
          }
        }
      } catch {
        // Search failed
      }

      streamChannel.emit({
        event: 'web_search_status',
        payload: { status: 'done' },
      });
    }

    // ── 5. 构建 SystemPrompt ──
    const parts: string[] = [
      '你是一个智能 AI 助手。你可以使用工具来帮助用户完成各种任务。',
      '',
      '## 可用工具',
      '- manage_todos: 创建/更新/删除/查询待办事项',
      '- manage_events: 创建/更新/删除/查询日程事件',
      '- query_weather: 查询天气信息',
      '- search_web: 联网搜索最新信息',
    ];

    if (userId) {
      parts.push('- search_knowledge: 搜索个人知识库');
    }

    parts.push(
      '',
      '## 工具使用规则',
      '1. 需要实时信息时使用 search_web',
      '2. 询问个人知识时使用 search_knowledge',
      '3. 可以多次调用不同工具以获得完整信息',
      '4. 根据工具结果回答，不要编造信息',
      '5. 不需要工具时直接回答',
      '6. 回答用户时，**不要提及工具名称或内部调用过程**，直接给出结果即可',
      '7. 用户只需要知道最终答案，不需要知道你是否使用了工具',
    );

    // Skills system prompt
    if (userId) {
      try {
        const skillPrompt = await deps.skillsService.buildSystemPromptForChat(
          userId,
          undefined,
          userInput,
        );
        if (skillPrompt) parts.push('', skillPrompt);
      } catch {
        // Skills failed
      }
    }

    // KB 上下文注入
    if (knowledgeContext) {
      parts.push('', knowledgeContext);
    }

    // WebSearch 上下文注入
    if (webSearchContext) {
      parts.push(
        '',
        '## 【联网搜索结果】',
        '以下为实时检索结果，请基于此回答（不要使用不存在的细节）：',
        webSearchContext,
      );
    }

    parts.push('', `当前日期: ${new Date().toISOString().split('T')[0]}`);

    const systemPromptContent = parts.join('\n');
    const systemMsg = new SystemMessage(systemPromptContent);

    // ── 6. 构建工具列表 ──
    const builtInTools = [
      createManageTodosTool(deps.commandService, deps.llm, userId),
      createManageEventsTool(
        deps.commandService,
        deps.llm,
        userId,
        currentDate,
      ),
      createQueryWeatherTool(
        deps.weatherService,
        deps.mcpServersService,
        deps.llm,
        userId,
        currentDate,
      ),
      createSearchWebTool(
        deps.mcpServersService,
        deps.webSearchService,
        userId,
      ),
    ];

    const allBuiltIn = userId
      ? [
          ...builtInTools,
          createSearchKnowledgeTool(deps.knowledgeBaseService, userId),
        ]
      : builtInTools;

    const mcpTools = await createDynamicMcpTools(deps.mcpServersService, userId);

    const tools = combineTools(allBuiltIn, mcpTools);
    const toolNames = tools.map((t) => t.name);

    // ── 7. emit preprocess_done ──
    streamChannel.emit({
      event: 'preprocess_done',
      payload: {
        hasKnowledge: !!knowledgeContext,
        hasWebSearch: !!webSearchContext,
        toolCount: tools.length,
      },
    });

    return {
      messages: [systemMsg, ...scopedHistory, userHuman],
      knowledgeContext,
      knowledgeLoaded: !!knowledgeContext,
      webSearchContext,
      webSearchDone: !!webSearchContext,
      tools,
      toolNames,
      systemPrompt: systemPromptContent,
    };
  };
}
