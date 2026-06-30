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
import { combineTools } from '../../tools/combine-tools';
import { createSearchKnowledgeTool } from '../../tools/built-in/search-knowledge.tool';
import { createDynamicMcpTools } from '../../tools/mcp/mcp-tool-factory';
import type { WorkflowDeps } from '../workflow';
import { buildChatHumanMessage } from '../../../utils/build-chat-human-message';

/**
 * 判断用户查询是否明显是本地数据操作，无需自动联网搜索。
 * 匹配后跳过预处理的自动搜索，避免浪费 API 调用。
 * LLM 仍然可以使用工具列表中的 search 工具自行决定搜索。
 */
function isLocalDataQuery(query: string): boolean {
  const patterns = [
    // 查询/查看本地数据
    /^(查询|查看|看看|浏览|列出|打开|进入|显示)\s*(我的|个人)?\s*(待办|日程|笔记|收藏|关注|粉丝|通知|消息|评论|点赞|信息|资料|设置|配置|订单|地址|文章|博客|动态|话题|草稿|用户)/i,
    // 创建/修改/删除本地数据
    /^(创建|新建|添加|增加|新增|修改|更新|编辑|删除|移除|取消|完成)\s*(待办|日程|笔记|收藏|文章|博客|评论|动态|任务|事件)/i,
    // "我的XXX"
    /^我的\s*(待办|日程|笔记|收藏|关注|粉丝|通知|消息|信息|资料|订单|地址|文章|博客|动态|话题|草稿)/i,
    // "有什么/有哪些 XXX"
    /^(有什么|有哪些)\s*(待办|日程|笔记|任务|通知|消息|收藏)/i,
    // "今天/明天/昨天 XXX (含日程/待办相关)"
    /^(今天|明天|后天|昨天)\s*(的)?\s*(日程|待办|笔记|任务|安排)/i,
    // 个人信息查询
    /^(我是谁|我的个人信息|查看个人|我的账号|查看账号)/i,
    // 纯问候/闲聊（无需搜索）
    /^(你好|您好|hi|hello|嗨|早上好|下午好|晚上好|再见|拜拜|谢谢|感谢)$/i,
  ];
  return patterns.some((re) => re.test(query.trim()));
}

/**
 * 创建预处理节点
 */
export function createPreprocessNode(deps: WorkflowDeps) {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const { userInput, userId, sessionId, contextWindow, streamChannel } =
      state;

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

    // ── 4. 可选 WebSearch（由 enableWebSearch 控制，且仅对非本地数据查询触发） ──
    let webSearchContext: string | null = null;
    const needsSearch =
      userId && state.enableWebSearch && !isLocalDataQuery(userInput);
    if (needsSearch) {
      streamChannel.emit({
        event: 'web_search_status',
        payload: { status: 'searching' },
      });
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
        // MCP search 未配置或失败，跳过
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
      '## 工具使用规则',
      '1. 根据用户需求选择合适的工具',
      '2. 可以多次调用不同工具以获得完整信息',
      '3. 根据工具结果回答，不要编造信息',
      '4. 不需要工具时直接回答',
      '5. 回答用户时，**不要提及工具名称或内部调用过程**，直接给出结果即可',
      '6. 用户只需要知道最终答案，不需要知道你是否使用了工具',
    ];

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
    const builtInTools = userId
      ? [createSearchKnowledgeTool(deps.knowledgeBaseService, userId)]
      : [];

    const mcpTools = await createDynamicMcpTools(
      deps.mcpServersService,
      userId,
    );

    const tools = combineTools(builtInTools, mcpTools);
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
