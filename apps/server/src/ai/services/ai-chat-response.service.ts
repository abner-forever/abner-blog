import { Injectable } from '@nestjs/common';

@Injectable()
export class AIChatResponseService {
  buildPrompt(message: string): string {
    return `你是一个友好的中文AI助手。请结合已给出的历史对话语境，直接回答用户问题，避免模板化回复。\n\n用户输入：${message}`;
  }

  /** 联网检索后的完整用户侧指令（与 buildPrompt 同级，供多轮 history + 本条一并送入模型） */
  buildWebSearchChatPrompt(userQuestion: string, searchDigest: string): string {
    return [
      '你是一个友好的中文AI助手。用户请求联网检索。',
      '请严格基于下方「检索摘要」作答：不要使用摘要中不存在的事实；不确定时请说明；可在文末列出新闻对应的参考链接（须来自摘要中的 URL）。',
      '',
      `用户原始问题：${userQuestion}`,
      '',
      '【检索摘要】',
      searchDigest,
    ].join('\n');
  }

  buildFallback(message: string): string {
    const text = message.trim();
    if (/react/i.test(text)) {
      return 'React 是一个用于构建用户界面的 JavaScript 库，核心是组件化和声明式渲染，常用于单页应用开发。';
    }
    return '我在这，咱们可以正常聊天。你可以继续问我一个问题，比如“React 是什么”或“帮我解释一下闭包”。';
  }

  shouldUseFastPath(message: string): boolean {
    const text = message.trim();
    if (!text) return false;

    const taskOrToolingPattern =
      /(待办|日程|行程|提醒|创建|新增|添加|新建|删除|取消|移除|修改|更新|改成|改为|查询|查看|安排|天气|气温|温度|降雨|风速)/;
    if (taskOrToolingPattern.test(text)) return false;

    const webSearchPattern =
      /(联网搜索|网上搜索|上网搜|联网查|网上查|搜一下|检索一下|web\s*search|search\s+the\s+web)/i;
    if (webSearchPattern.test(text)) return false;

    /** 含新闻/资讯等仍走意图识别，否则「帮我总结今天新闻」会误走 CHAT 快速路径、不会调 Tavily */
    if (
      /(新闻|资讯|热点|头条|时事|快讯|要闻|最新消息|今日要闻|热搜)/i.test(text)
    ) {
      return false;
    }

    const chatPattern =
      /(你是|你会|帮我|解释|介绍|是什么|为什么|怎么|如何|能不能|可以吗|\?|？|hello|hi|你好|谢谢|react|typescript|javascript|node)/i;
    return chatPattern.test(text);
  }

  /** 规范化助手回复 */
  normalizeAssistantReply(reply: string): string {
    const trimmed = reply.trim();
    if (!trimmed) return trimmed;
    const normalized = trimmed.replace(/\r\n/g, '\n');
    const dedupByHalf = this.dedupByRepeatedHalf(normalized);
    return this.dedupRepeatedParagraphs(dedupByHalf);
  }

  extractIncrementalDelta(existing: string, incoming: string): string {
    if (!incoming) return '';
    if (!existing) return incoming;
    if (incoming === existing) return '';
    if (incoming.startsWith(existing)) return incoming.slice(existing.length);
    if (existing.endsWith(incoming)) return '';
    return incoming;
  }

  private dedupByRepeatedHalf(text: string): string {
    const compact = text.replace(/\s+/g, '');
    if (!compact || compact.length % 2 !== 0) return text;
    const half = compact.length / 2;
    if (compact.slice(0, half) !== compact.slice(half)) return text;
    return text.slice(0, Math.floor(text.length / 2)).trim();
  }

  private dedupRepeatedParagraphs(text: string): string {
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (paragraphs.length < 2) return text.trim();

    const deduped: string[] = [];
    for (const paragraph of paragraphs) {
      if (deduped[deduped.length - 1] !== paragraph) deduped.push(paragraph);
    }
    return deduped.join('\n\n').trim();
  }
}
