/**
 * ToolResultValidator
 *
 * 验证工具执行结果的质量，决定是否需要重试或降级。
 * 在每个工具调用后执行。
 */

import type { BaseMessage, ToolMessage } from '@langchain/core/messages';

/** 验证结果 */
export interface ValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 是否应该重试 */
  shouldRetry: boolean;
  /** 验证消息 */
  message: string;
}

/**
 * 验证工具调用结果
 *
 * 检查维度：
 * 1. ToolMessage 是否包含错误信息
 * 2. 内容是否为空
 * 3. 是否需要重试
 *
 * @param toolMessages - ToolNode 返回的 ToolMessage 列表
 * @param retryCount - 当前已重试次数
 * @param maxRetries - 最大重试次数
 * @returns 验证结果数组（每个 tool call 一个）
 */
export function validateToolResults(
  toolMessages: BaseMessage[],
  retryCount: number,
  maxRetries: number,
): ValidationResult[] {
  return toolMessages
    .filter((msg): msg is ToolMessage => msg.constructor?.name === 'ToolMessage')
    .map((msg) => {
      const content =
        typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

      // 检查是否包含错误
      if (content.includes('"status":"error"') || content.includes('"status": "error"')) {
        if (retryCount < maxRetries) {
          return {
            valid: false,
            shouldRetry: true,
            message: `工具 ${msg.name || 'unknown'} 执行出错，准备重试 (${retryCount + 1}/${maxRetries})`,
          };
        }
        return {
          valid: false,
          shouldRetry: false,
          message: `工具 ${msg.name || 'unknown'} 执行失败，已达最大重试次数`,
        };
      }

      // 检查空内容
      if (!content || content === '{}') {
        return {
          valid: false,
          shouldRetry: retryCount < maxRetries,
          message: `工具 ${msg.name || 'unknown'} 返回空结果`,
        };
      }

      return {
        valid: true,
        shouldRetry: false,
        message: `工具 ${msg.name || 'unknown'} 执行成功`,
      };
    });
}
