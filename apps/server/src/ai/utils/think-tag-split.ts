/** 与 CHAT 流式 splitThinkTaggedDelta 一致，用于整段回复剥离思考标签 */

export const THINK_START_TAG = '<redacted_thinking>';
export const THINK_END_TAG = '</redacted_thinking>';
const THINK_START_TAG_LEGACY = '<think>';
const THINK_END_TAG_LEGACY = '</think>';

export interface ThinkTagSplitState {
  inThink: boolean;
  pending: string;
}

function longestTagPrefixSuffix(input: string, tag: string): string {
  const maxLen = Math.min(input.length, tag.length - 1);
  for (let len = maxLen; len > 0; len -= 1) {
    if (input.endsWith(tag.slice(0, len))) {
      return input.slice(-len);
    }
  }
  return '';
}

/**
 * 增量解析：与流式 chunk 兼容；同一 state 可多次调用。
 */
export function splitThinkTaggedDelta(
  delta: string,
  state: ThinkTagSplitState,
): { answerDelta: string; reasoningDelta: string } {
  // 兼容部分模型返回的 legacy think 标签
  let rest = (state.pending + delta)
    .replaceAll(THINK_START_TAG_LEGACY, THINK_START_TAG)
    .replaceAll(THINK_END_TAG_LEGACY, THINK_END_TAG);
  state.pending = '';
  let answerDelta = '';
  let reasoningDelta = '';

  while (rest.length > 0) {
    if (!state.inThink) {
      const idx = rest.indexOf(THINK_START_TAG);
      if (idx === -1) {
        const tail = longestTagPrefixSuffix(rest, THINK_START_TAG);
        if (tail) {
          answerDelta += rest.slice(0, rest.length - tail.length);
          state.pending = tail;
        } else {
          answerDelta += rest;
        }
        rest = '';
        continue;
      }
      answerDelta += rest.slice(0, idx);
      rest = rest.slice(idx + THINK_START_TAG.length);
      state.inThink = true;
      continue;
    }

    const idx = rest.indexOf(THINK_END_TAG);
    if (idx === -1) {
      const tail = longestTagPrefixSuffix(rest, THINK_END_TAG);
      if (tail) {
        reasoningDelta += rest.slice(0, rest.length - tail.length);
        state.pending = tail;
      } else {
        reasoningDelta += rest;
      }
      rest = '';
      continue;
    }

    reasoningDelta += rest.slice(0, idx);
    rest = rest.slice(idx + THINK_END_TAG.length);
    state.inThink = false;
  }

  return { answerDelta, reasoningDelta };
}

/**
 * 对一次性完整文本拆分正文与思考（用于天气等非流式合成路径）。
 */
export function splitCompleteReplyThink(text: string): {
  answer: string;
  thinking: string;
} {
  const state: ThinkTagSplitState = { inThink: false, pending: '' };
  const { answerDelta, reasoningDelta } = splitThinkTaggedDelta(text, state);
  let answer = answerDelta;
  let thinking = reasoningDelta;
  if (state.pending) {
    if (state.inThink) thinking += state.pending;
    else answer += state.pending;
  }
  return { answer, thinking };
}
