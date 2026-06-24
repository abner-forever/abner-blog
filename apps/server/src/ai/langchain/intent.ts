/**
 * 意图检测入口
 *
 * 重构后以 LangGraph 状态机为核心，将原始的规则+LLM 两层策略显式化为可观测的图结构。
 *
 * 向后兼容：保留 `detectIntent(llm, userInput)` 签名，新增 options 参数。
 *
 * 图定义见 `../langgraph/intent-graph.ts`。
 */

import { IntentType } from '../dto/extraction-result.dto';
import type { ChatLLM } from './model';
import { createIntentGraph } from '../langgraph/intent-graph';

export type DetectIntentOptions = {
  /** 用户 ID（undefined = 游客，游客强制 CHAT） */
  userId?: number;
  /** 消息中是否包含图片 */
  hasImages?: boolean;
  /** 当前日期 ISO 字符串 */
  currentDate?: string;
  /** 快速路径判定函数（true = 跳过意图检测直接 CHAT） */
  shouldUseFastPath?: (msg: string) => boolean;
};

/**
 * 检测用户消息意图
 *
 * 使用 LangGraph 状态机依次执行：
 * 1. checkPreconditions — 游客/图片/快速路径 → CHAT
 * 2. ruleBasedDetection — 正则规则匹配（毫秒级）
 * 3. llmDetection — LLM 兜底分类
 * 4. resolveIntent — LLM 结果优先，回退规则，再回退 CHAT
 *
 * @param llm      LLM 实例（用于 LLM 兜底）
 * @param userInput 用户消息
 * @param options   额外选项（userId/hasImages/shouldUseFastPath 等）
 * @returns 检测到的意图
 *
 * @example
 * // 向后兼容（纯规则+LLM，无前置条件）
 * const intent = await detectIntent(llm, '明天天气怎么样');
 *
 * @example
 * // 完整模式（包含前置条件检测）
 * const intent = await detectIntent(llm, '你好', {
 *   userId: 1,
 *   hasImages: false,
 *   shouldUseFastPath: (msg) => chatResponseService.shouldUseFastPath(msg),
 * });
 */
export async function detectIntent(
  llm: ChatLLM,
  userInput: string,
  options?: DetectIntentOptions,
): Promise<IntentType> {
  const {
    userId,
    hasImages = false,
    currentDate = new Date().toISOString(),
    shouldUseFastPath,
  } = options ?? {};

  const graph = createIntentGraph(llm, shouldUseFastPath ?? (() => false));

  const result = await graph.invoke({
    userInput,
    userId: userId ?? (undefined as unknown as number),
    hasImages,
    currentDate,
  });

  return result.finalIntent ?? IntentType.CHAT;
}
