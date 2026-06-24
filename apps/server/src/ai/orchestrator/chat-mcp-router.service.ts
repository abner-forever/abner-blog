import { Injectable, Logger } from '@nestjs/common';
import { MCPServersService } from '../../mcp';
import { AIWeatherService } from '../services/ai-weather.service';
import { AIChatSessionService } from '../services/ai-chat-session.service';
import { AIChatResponseService } from '../services/ai-chat-response.service';
import { extractWeatherQueryContext } from '../langchain/chains';
import {
  extractGithubOwnerRepo,
  extractGithubIssueDraft,
} from '../utils/github-chat';
import { ChatResponseDto } from '../dto/extraction-result.dto';
import type { ChatLLM } from '../langchain/model';

@Injectable()
export class ChatMcpRouterService {
  private readonly logger = new Logger(ChatMcpRouterService.name);
  private readonly maxHistoryMessages = 10;

  constructor(
    private readonly mcpServersService: MCPServersService,
    private readonly weatherService: AIWeatherService,
    private readonly chatSessionService: AIChatSessionService,
    private readonly chatResponseService: AIChatResponseService,
  ) {}

  /**
   * 通过 MCP 协议调用天气工具
   * 统一使用 MCPServersService.callToolForUser，消除手工 HTTP MCP 协议代码
   */
  async buildWeatherResponseViaMcp(
    llm: ChatLLM,
    message: string,
    currentDate: string,
    userId: number | undefined,
  ): Promise<string> {
    const weatherQueryContext = await extractWeatherQueryContext(
      llm,
      message,
      currentDate,
    );
    const city = weatherQueryContext.city || '北京';
    const targetDate = weatherQueryContext.date;

    try {
      const result = await this.mcpServersService.callToolForUser(
        userId,
        'get_weather',
        { city, date: targetDate },
      );
      const firstContent = result.content?.[0];
      const text =
        firstContent?.type === 'text' ? firstContent.text : '获取天气信息失败';
      this.logger.log(
        `[MCP Weather] City: ${city}, Result: ${text.substring(0, 50)}...`,
      );
      return text;
    } catch (error) {
      this.logger.error(`[MCP Weather] Error: ${error}`);
      return `通过 MCP 获取天气信息失败: ${error instanceof Error ? error.message : '未知错误'}`;
    }
  }

  /**
   * 使用 LLM 结合用户原话，从 MCP 天气工具返回的结构化事实文本生成完整回复。
   */
  async buildMcpWeatherUserReply(
    llm: ChatLLM,
    userMessage: string,
    mcpWeatherText: string,
  ): Promise<string> {
    return this.weatherService.composeMcpWeatherUserReply(
      llm,
      userMessage,
      mcpWeatherText,
    );
  }

  async tryHandleGithubChatViaMcp(
    message: string,
    userId: number | undefined,
    sessionId?: string,
  ): Promise<ChatResponseDto | null> {
    if (!userId) return null;
    const ownerRepoMatch = extractGithubOwnerRepo(message);
    if (!ownerRepoMatch) return null;

    const owner = ownerRepoMatch.owner;
    const repo = ownerRepoMatch.repo;
    const lower = message.toLowerCase();
    const askIssue =
      lower.includes('issue') ||
      message.includes('问题单') ||
      message.includes('缺陷');
    const createIssueIntent =
      (lower.includes('issue') &&
        (lower.includes('create') ||
          lower.includes('open') ||
          lower.includes('file'))) ||
      message.includes('提个问题') ||
      message.includes('提个issue') ||
      message.includes('提 issue') ||
      message.includes('创建issue') ||
      message.includes('创建 issue') ||
      message.includes('新建issue') ||
      message.includes('报个 bug') ||
      message.includes('报bug');
    const askPr =
      /\bpr\b/.test(lower) ||
      lower.includes('pull request') ||
      message.includes('合并请求');
    const askRepo =
      lower.includes('repo') ||
      lower.includes('repository') ||
      message.includes('仓库');
    const hasGithubHint =
      lower.includes('github') ||
      askIssue ||
      askPr ||
      askRepo ||
      message.includes('仓库');
    if (!hasGithubHint) return null;

    let toolName = askIssue ? 'list_issues' : askPr ? 'list_prs' : 'get_repo';
    let params: Record<string, unknown> = {
      owner,
      repo,
      ...(askIssue || askPr ? { state: 'open', per_page: 10 } : {}),
    };

    if (createIssueIntent) {
      const draft = extractGithubIssueDraft(message);
      if (!draft?.title) {
        return {
          type: 'chat',
          content:
            '我已识别到你想创建 GitHub Issue，请补充标题，例如：在 owner/repo 提个 issue，标题是"首页无法访问"，内容是"访问 / 返回 404"。',
        };
      }
      toolName = 'create_issue';
      params = {
        owner,
        repo,
        title: draft.title,
        body: draft.body || undefined,
      };
    }

    try {
      const result = await this.mcpServersService.callToolForUser(
        userId,
        toolName,
        params,
      );
      const first = result.content.find((item) => item.type === 'text');
      const content =
        first?.text?.trim() ||
        `已通过 GitHub MCP 调用 ${toolName}，但未返回可展示文本。`;
      const normalized =
        this.chatResponseService.normalizeAssistantReply(content);
      const sessionKey = this.chatSessionService.getSessionKey(
        userId,
        sessionId,
      );
      this.chatSessionService.appendHistory(
        sessionKey,
        message,
        normalized,
        this.maxHistoryMessages,
      );
      return { type: 'chat', content: normalized };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '调用失败';
      if (msg.includes('未找到可用的 MCP 工具')) {
        return {
          type: 'chat',
          content:
            '检测到你在查询 GitHub 信息，但当前未安装或未启用 GitHub MCP 工具。请到 MCP 面板安装并启用 GitHub 集成后重试。',
        };
      }
      return {
        type: 'chat',
        content: `已识别为 GitHub 请求，但 MCP 调用失败：${msg}`,
      };
    }
  }

  async tryHandleUserInfoViaMcp(
    message: string,
    userId: number | undefined,
    sessionId?: string,
  ): Promise<ChatResponseDto | null> {
    if (!userId) return null;
    const text = message.trim();
    if (!text) return null;

    const askUserProfile =
      /(用户信息|个人信息|账号信息|我的资料|我的信息|个人资料)/.test(text) ||
      (text.includes('用户') && text.includes('信息'));
    if (!askUserProfile) return null;

    const idMatch = text.match(/(?:id|ID|用户ID|用户id)\s*[:：=]?\s*(\d+)/);
    const requestedId = idMatch ? Number(idMatch[1]) : undefined;

    try {
      const result = await this.mcpServersService.callToolForUser(
        userId,
        'get_user_info',
        requestedId ? { id: requestedId } : {},
      );
      const first = result.content.find((item) => item.type === 'text');
      const content =
        first?.text?.trim() || '已调用 get_user_info，但未返回可展示文本。';
      const normalized =
        this.chatResponseService.normalizeAssistantReply(content);
      const sessionKey = this.chatSessionService.getSessionKey(
        userId,
        sessionId,
      );
      this.chatSessionService.appendHistory(
        sessionKey,
        message,
        normalized,
        this.maxHistoryMessages,
      );
      return { type: 'chat', content: normalized };
    } catch (error) {
      const msg = error instanceof Error ? error.message : '调用失败';
      if (msg.includes('未找到可用的 MCP 工具')) {
        return {
          type: 'chat',
          content:
            '检测到你在查询用户信息，但当前未安装或未启用「用户助手」MCP。请到 MCP 面板安装并启用后重试。',
        };
      }
      return {
        type: 'chat',
        content: `已识别为用户信息查询，但 MCP 调用失败：${msg}`,
      };
    }
  }
}
