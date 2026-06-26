/**
 * LangGraph 意图检测图
 *
 * 将原有的手动 if/else 意图检测重构为显式的状态机图：
 *
 *   START
 *     │
 *     ▼
 *   checkPreconditions  ──fast path──→  resolveIntent  ──→  END
 *     │                                  (CHAT)
 *     │ normal
 *     ▼
 *   ruleBasedDetection
 *     │
 *     ▼
 *   llmDetection（始终执行，LLM 结果优先）
 *     │
 *     ▼
 *   resolveIntent  ──→  END
 *   (LLM > Rule > CHAT)
 *
 * 每个节点都是独立可测试的纯函数/工厂函数。
 */

import {
  StateGraph,
  Annotation,
  AnnotationRoot,
  START,
  END,
  CompiledStateGraph,
} from '@langchain/langgraph';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { IntentType } from '../dto/extraction-result.dto';
import type { ChatLLM } from '../langchain/model';
import { INTENT_PROMPT } from '../langchain/prompts';
import { getTextContent } from '../langchain/parsers';
import { splitCompleteReplyThink } from '../utils/think-tag-split';

// ──────────── 类型 ────────────

type RuleIntentResult = {
  intent: IntentType;
  confidence: number;
  rule: string;
};

type LlmDetectionResult = {
  llmRawOutput: string | null;
  llmIntent: IntentType | null;
};

// ──────────── State 定义 ────────────

/**
 * 将 spec 提取为独立 const，再用 `AnnotationRoot<typeof spec>` 显式注解，
 * 避免 TypeScript 在 declaration emit 时从 Annotation.Root() 深推 AnnotationRoot 类型。
 */
const intentDetectionStateSpec = {
  /** 用户原始输入 */
  userInput: Annotation<string>(),
  /** 当前日期 ISO 字符串 */
  currentDate: Annotation<string>(),
  /** 用户 ID（undefined ＝ 游客） */
  userId: Annotation<number>(),
  /** 是否包含图片 */
  hasImages: Annotation<boolean>(),
  /** 是否走快速路径 */
  useFastPath: Annotation<boolean>(),
  /** 规则检测结果（null ＝ 无匹配） */
  ruleResult: Annotation<RuleIntentResult | null>(),
  /** LLM 原始输出文本 */
  llmRawOutput: Annotation<string | null>(),
  /** 解析后的 llm 意图（null ＝ 无法解析） */
  llmIntent: Annotation<IntentType | null>(),
  /** 最终确定的意图 */
  finalIntent: Annotation<IntentType | null>(),
  /** 置信度 */
  confidence: Annotation<number>(),
  /** 检测方式（fast_path | rule | llm | fallback_chat） */
  detectionMethod: Annotation<string>(),
  /** 错误收集（reducer 累加） */
  errors: Annotation<string[]>({
    reducer: (left: string[], right: string | string[]) => {
      if (Array.isArray(right)) return left.concat(right);
      return left.concat([right]);
    },
    default: () => [],
  }),
};

const IntentDetectionState: AnnotationRoot<typeof intentDetectionStateSpec> =
  Annotation.Root(intentDetectionStateSpec);

type GraphState = typeof IntentDetectionState.State;

// ═══════════════════════════════════════════
//  纯函数（规则检测 & LLM 输出映射）
// ═══════════════════════════════════════════

/**
 * 基于正则规则的意图检测（毫秒级，覆盖 80% 常见场景）
 */
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

/**
 * 将 LLM 输出的原始文本映射为 IntentType
 */
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
    聊天: IntentType.CHAT,
  };
  if (chineseMap[normalized]) return chineseMap[normalized];
  if (chineseMap[firstLine]) return chineseMap[firstLine];

  const intentFieldMatch = normalized.match(
    /"intent"\s*:\s*"(create_todo|create_event|update_todo|update_event|delete_todo|delete_event|query_schedule|query_weather|web_search|chat)"/,
  );
  if (intentFieldMatch) {
    if (intentFieldMatch[1] === 'web_search') return IntentType.CHAT;
    if (strictIntentMap[intentFieldMatch[1]]) {
      return strictIntentMap[intentFieldMatch[1]];
    }
  }

  if (normalized === 'web_search' || firstToken === 'web_search') {
    return IntentType.CHAT;
  }

  return null;
}

// ═══════════════════════════════════════════
//  Graph 节点工厂
// ═══════════════════════════════════════════

/**
 * 第 1 步：前置条件检查
 * - 游客 → 强制 CHAT
 * - 含图片 → 强制 CHAT
 * - 快速路径匹配（纯问候/简单 Q&A）→ CHAT
 * - 否则走正常意图检测
 */
function createCheckPreconditionsNode(
  shouldUseFastPath: (msg: string) => boolean,
) {
  return (state: GraphState): Partial<GraphState> => {
    const { userInput, hasImages } = state;
    // userId 在运行时可能为 undefined（Annotation<number> 默认值），此处视作游客
    const isGuest = !state.userId;
    const isFastPath = !hasImages && shouldUseFastPath(userInput);
    const useFastPath = isFastPath || hasImages || isGuest;

    process.stderr.write(
      `[AI Intent Graph] checkPreconditions: fastPath=${isFastPath} hasImages=${hasImages} guest=${isGuest} → ${useFastPath ? 'fast_path' : 'normal_detection'}\n`,
    );

    return { useFastPath };
  };
}

/**
 * 第 2 步：基于正则规则的意图检测
 */
function createRuleBasedDetectionNode() {
  return (state: GraphState): Partial<GraphState> => {
    const { userInput } = state;
    const ruleResult = detectIntentByRules(userInput);

    if (ruleResult) {
      process.stderr.write(
        `[AI Intent Graph] Rule matched: ${ruleResult.intent} (confidence=${ruleResult.confidence.toFixed(2)}, rule=${ruleResult.rule})\n`,
      );
    }

    return { ruleResult };
  };
}

/**
 * 第 3 步：LLM 意图分类兜底
 */
function createLlmDetectionNode(llm: ChatLLM) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const { userInput } = state;
    try {
      const prompt = `${INTENT_PROMPT}\n\n用户输入：${userInput}`;
      const result = await llm.invoke([
        new SystemMessage('你是一个任务管理助手。'),
        new HumanMessage(prompt),
      ]);

      const raw = getTextContent(result);
      const { answer, thinking } = splitCompleteReplyThink(raw);
      const intentSource = (answer.trim() || raw.trim()).toLowerCase();
      const mappedIntent = mapIntentFromText(intentSource);

      process.stderr.write(
        `[AI Intent Graph] LLM result: rawLen=${raw.length} thinkLen=${thinking.length} text="${intentSource.slice(0, 80)}${intentSource.length > 80 ? '…' : ''}" mapped=${mappedIntent ?? 'null'}\n`,
      );

      return {
        llmRawOutput: intentSource,
        llmIntent: mappedIntent,
      } satisfies LlmDetectionResult as Partial<GraphState>;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      process.stderr.write(`[AI Intent Graph] LLM error: ${msg}\n`);
      return {
        llmRawOutput: null,
        llmIntent: null,
      };
    }
  };
}

/**
 * 第 4 步：综合所有结果，确定最终意图
 * 优先级：fast_path → LLM 匹配 → 规则匹配 → CHAT 兜底
 */
function createResolveIntentNode() {
  return (state: GraphState): Partial<GraphState> => {
    const { useFastPath, ruleResult, llmIntent } = state;

    // 快速路径 → CHAT
    if (useFastPath) {
      return {
        finalIntent: IntentType.CHAT,
        confidence: 1.0,
        detectionMethod: 'fast_path',
      };
    }

    // LLM 结果优先
    if (llmIntent != null) {
      return {
        finalIntent: llmIntent,
        confidence: ruleResult?.confidence ?? 0.5,
        detectionMethod: 'llm',
      };
    }

    // 回退到规则结果
    if (ruleResult != null) {
      return {
        finalIntent: ruleResult.intent,
        confidence: ruleResult.confidence,
        detectionMethod: 'rule',
      };
    }

    // 默认 CHAT
    return {
      finalIntent: IntentType.CHAT,
      confidence: 0,
      detectionMethod: 'fallback_chat',
    };
  };
}

// ═══════════════════════════════════════════
//  条件边路由
// ═══════════════════════════════════════════

/**
 * 前置条件检查后的路由：
 * - useFastPath === true → 直接跳到 resolveIntent
 * - 否则 → ruleBasedDetection
 */
function routeAfterPreconditions(state: GraphState): string {
  return state.useFastPath ? 'resolveIntent' : 'ruleBasedDetection';
}

// ═══════════════════════════════════════════
//  图工厂
// ═══════════════════════════════════════════

/**
 * 创建一个已编译的 LangGraph 意图检测图
 *
 * @param llm - 用于 LLM 兜底的 ChatLLM 实例
 * @param shouldUseFastPath - 快速路径判定函数
 * @returns 编译后的 StateGraph，可通过 `.invoke(input)` 运行
 */
export function createIntentGraph(
  llm: ChatLLM,
  shouldUseFastPath: (msg: string) => boolean,
) {
  const workflow = new StateGraph(IntentDetectionState)
    .addNode(
      'checkPreconditions',
      createCheckPreconditionsNode(shouldUseFastPath),
    )
    .addNode('ruleBasedDetection', createRuleBasedDetectionNode())
    .addNode('llmDetection', createLlmDetectionNode(llm))
    .addNode('resolveIntent', createResolveIntentNode())
    .addEdge(START, 'checkPreconditions')
    .addConditionalEdges('checkPreconditions', routeAfterPreconditions, {
      resolveIntent: 'resolveIntent',
      ruleBasedDetection: 'ruleBasedDetection',
    })
    .addEdge('ruleBasedDetection', 'llmDetection')
    .addEdge('llmDetection', 'resolveIntent')
    .addEdge('resolveIntent', END);

  return workflow.compile() as CompiledStateGraph<
    GraphState,
    Partial<GraphState>
  >;
}
