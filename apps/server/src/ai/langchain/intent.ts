import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { IntentType } from '../dto/extraction-result.dto';
import type { ChatLLM } from './model';
import { getTextContent } from './parsers';
import { INTENT_PROMPT } from './prompts';

export async function detectIntent(
  llm: ChatLLM,
  userInput: string,
): Promise<IntentType> {
  const ruleResult = detectIntentByRules(userInput);
  if (ruleResult) {
    process.stderr.write(
      `[AI Intent] Rule matched: ${ruleResult.intent} (confidence=${ruleResult.confidence.toFixed(
        2,
      )}, rule=${ruleResult.rule})\n`,
    );
    if (ruleResult.confidence >= 0.8) return ruleResult.intent;
  }

  const prompt = `${INTENT_PROMPT}\n\n用户输入：${userInput}`;
  try {
    const result = await llm.invoke([
      new SystemMessage('你是一个任务管理助手。'),
      new HumanMessage(prompt),
    ]);

    const content = getTextContent(result);
    process.stderr.write(`[AI Intent] LLM Response: "${content}"\n`);

    const trimmed = content.trim().toLowerCase();
    process.stderr.write(`[AI Intent] Trimmed: "${trimmed}"\n`);

    const mappedIntent = mapIntentFromText(trimmed);
    if (mappedIntent) return mappedIntent;

    process.stderr.write('[AI Intent] No match found, returning CHAT\n');
    return ruleResult?.intent ?? IntentType.CHAT;
  } catch (error) {
    process.stderr.write(`[AI Intent] Error: ${error}\n`);
    return ruleResult?.intent ?? IntentType.CHAT;
  }
}

function mapIntentFromText(text: string): IntentType | null {
  if (!text) return null;
  const normalized = text
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    .trim()
    .toLowerCase();
  const firstLine = normalized.split('\n')[0]?.trim() || '';
  const firstToken = firstLine.split(/\s+/)[0] || '';

  const strictIntentMap: Record<string, IntentType> = {
    create_todo: IntentType.CREATE_TODO,
    create_event: IntentType.CREATE_EVENT,
    update_todo: IntentType.UPDATE_TODO,
    update_event: IntentType.UPDATE_EVENT,
    delete_todo: IntentType.DELETE_TODO,
    delete_event: IntentType.DELETE_EVENT,
    query_schedule: IntentType.QUERY_SCHEDULE,
    query_weather: IntentType.QUERY_WEATHER,
    web_search: IntentType.WEB_SEARCH,
    chat: IntentType.CHAT,
  };

  if (strictIntentMap[normalized]) return strictIntentMap[normalized];
  if (strictIntentMap[firstToken]) return strictIntentMap[firstToken];

  const chineseMap: Record<string, IntentType> = {
    创建待办: IntentType.CREATE_TODO,
    新建待办: IntentType.CREATE_TODO,
    创建日程: IntentType.CREATE_EVENT,
    新建日程: IntentType.CREATE_EVENT,
    修改待办: IntentType.UPDATE_TODO,
    更新待办: IntentType.UPDATE_TODO,
    修改日程: IntentType.UPDATE_EVENT,
    更新日程: IntentType.UPDATE_EVENT,
    删除待办: IntentType.DELETE_TODO,
    删除日程: IntentType.DELETE_EVENT,
    查询日程: IntentType.QUERY_SCHEDULE,
    查询天气: IntentType.QUERY_WEATHER,
    联网搜索: IntentType.WEB_SEARCH,
    网上搜索: IntentType.WEB_SEARCH,
    聊天: IntentType.CHAT,
  };
  if (chineseMap[normalized]) return chineseMap[normalized];
  if (chineseMap[firstLine]) return chineseMap[firstLine];

  const intentFieldMatch = normalized.match(
    /"intent"\s*:\s*"(create_todo|create_event|update_todo|update_event|delete_todo|delete_event|query_schedule|query_weather|web_search|chat)"/,
  );
  if (intentFieldMatch && strictIntentMap[intentFieldMatch[1]]) {
    return strictIntentMap[intentFieldMatch[1]];
  }

  return null;
}

type RuleIntentResult = {
  intent: IntentType;
  confidence: number;
  rule: string;
};

function detectIntentByRules(userInput: string): RuleIntentResult | null {
  const text = userInput.trim();
  if (!text) return null;
  const normalized = text.replace(/[？?]/g, '').trim();

  const hasQueryVerb =
    /(查看|查询|查下|查一下|看看|列出|统计|有哪些|有啥|有什么)/i.test(text);
  const hasTodoOrScheduleNoun = /(待办|todo|任务|日程|安排|行程)/i.test(text);
  const hasListOrWhatsOn = /(有什么|有啥|有哪些|查看|查询|看看|列出)/i.test(
    text,
  );
  /** 「今天有什么…」仅在有日程/待办语境时才算查日程，避免「今天有什么新闻」误判 */
  const isScheduleQuery =
    /(查看|查询|看看|列出).*(日程|安排|行程)/.test(text) ||
    /(日程|安排|行程).*(查看|查询|看看|列出)/.test(text) ||
    /(查看|查询|看看|列出).*(待办|todo|任务)/i.test(text) ||
    /(待办|todo|任务).*(查看|查询|看看|列出)/i.test(text) ||
    (hasQueryVerb && hasTodoOrScheduleNoun && hasListOrWhatsOn) ||
    (/这周|今天|明天|后天|最近/.test(text) &&
      hasTodoOrScheduleNoun &&
      hasListOrWhatsOn);

  const isCompactScheduleQuery =
    /^(我|我的)?(最近|近期|当前|现在|今天|这周|本周|最近一段时间)?的?(待办|todo|任务|日程|安排|行程)$/.test(
      normalized,
    );

  if (isCompactScheduleQuery) {
    return {
      intent: IntentType.QUERY_SCHEDULE,
      confidence: 0.92,
      rule: 'compact_schedule',
    };
  }
  if (isScheduleQuery) {
    return {
      intent: IntentType.QUERY_SCHEDULE,
      confidence: 0.72,
      rule: 'schedule_query',
    };
  }

  const hasWeatherKeyword =
    /(天气|气温|温度|下雨|降雨|晴天|阴天|多云|风力|风速)/i.test(text);
  if (hasWeatherKeyword) {
    return {
      intent: IntentType.QUERY_WEATHER,
      confidence: 0.76,
      rule: 'weather_keyword',
    };
  }

  const hasNewsOrPublicInfo =
    /(新闻|资讯|热点|头条|时事|快讯|要闻|最新消息|今日要闻|国内消息|国际消息|热搜)/i.test(
      text,
    );
  if (hasNewsOrPublicInfo) {
    return {
      intent: IntentType.WEB_SEARCH,
      confidence: 0.82,
      rule: 'news_or_public_info',
    };
  }

  const hasTaskOrWeatherNoun =
    /(待办|todo|任务|日程|安排|行程|天气|气温|温度|下雨|降雨|晴天|风力|风速)/i.test(
      text,
    );
  const hasExplicitWebSearch =
    /(联网搜索|联网查|网上搜索|网上查|上网搜|用搜索引擎|search\s+the\s+web|web\s*search)/i.test(
      text,
    );
  const hasLooseWebSearchVerb =
    /(搜一下|搜索一下|帮我搜|检索一下|查一下网上|上网查|百度一下|google一下)/i.test(
      text,
    );
  if (hasExplicitWebSearch) {
    return {
      intent: IntentType.WEB_SEARCH,
      confidence: 0.9,
      rule: 'explicit_web_search',
    };
  }
  if (hasLooseWebSearchVerb && !hasTaskOrWeatherNoun) {
    return {
      intent: IntentType.WEB_SEARCH,
      confidence: 0.72,
      rule: 'search_verb_no_task',
    };
  }

  const hasTodoKeyword =
    /(待办|todo|提醒我|记得|记一下|需要做|要做|去做|帮我记|记着)/i.test(text);
  const hasTodoCreateAction =
    /(创建|新增|添加|新建|记一下|记下|记住|提醒我|帮我记|加个待办|添加待办|新增待办)/i.test(
      text,
    );
  const hasDeleteKeyword = /(取消|删除|删掉|不要了|移除)/i.test(text);
  const hasUpdateKeyword = /(改成|改为|改到|修改|更新|调整|延期|提前)/i.test(
    text,
  );
  const hasScheduleKeyword = /(日程|安排|行程|会议|约|开会|跑步|活动)/i.test(
    text,
  );
  const hasTimeExpression =
    /(明天|后天|今天|明早|明上午|明下午|今晚|上午|下午|晚上|中午|凌晨|周[一二三四五六日天]|下周|本周|\d{1,2}[:：点]\d{0,2}|\d{1,2}\s*(到|至|-)\s*\d{1,2}\s*点?)/.test(
      text,
    );
  const hasLifeEventKeyword = /(遛弯|散步|锻炼|运动|跑步|见面|吃饭|约会)/i.test(
    text,
  );

  if (hasDeleteKeyword && hasScheduleKeyword) {
    return {
      intent: IntentType.DELETE_EVENT,
      confidence: 0.9,
      rule: 'delete_event',
    };
  }
  if (hasDeleteKeyword && hasTimeExpression) {
    return {
      intent: IntentType.DELETE_EVENT,
      confidence: 0.9,
      rule: 'delete_event_time',
    };
  }
  if (hasDeleteKeyword && hasLifeEventKeyword) {
    return {
      intent: IntentType.DELETE_EVENT,
      confidence: 0.88,
      rule: 'delete_event_life',
    };
  }
  if (hasDeleteKeyword && hasTodoKeyword) {
    return {
      intent: IntentType.DELETE_TODO,
      confidence: 0.88,
      rule: 'delete_todo',
    };
  }
  if (hasUpdateKeyword && hasScheduleKeyword) {
    return {
      intent: IntentType.UPDATE_EVENT,
      confidence: 0.9,
      rule: 'update_event',
    };
  }
  if (hasUpdateKeyword && hasTodoKeyword) {
    return {
      intent: IntentType.UPDATE_TODO,
      confidence: 0.88,
      rule: 'update_todo',
    };
  }

  if (hasTodoKeyword && hasTodoCreateAction) {
    return {
      intent: IntentType.CREATE_TODO,
      confidence: 0.86,
      rule: 'create_todo',
    };
  }
  const hasEventAction =
    /(开会|会议|约|见面|拜访|安排|日程|行程|活动|上课|复习|就诊|看病|出发|出差|提醒我.*(时间|几点))/i.test(
      text,
    );

  if (hasTimeExpression && hasEventAction) {
    return {
      intent: IntentType.CREATE_EVENT,
      confidence: 0.87,
      rule: 'create_event_time',
    };
  }
  return null;
}
