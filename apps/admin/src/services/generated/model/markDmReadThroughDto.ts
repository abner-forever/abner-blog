export interface MarkDmReadThroughDto {
  /**
   * 已看到的最晚一条消息 ID（进入聊天可视区域）
   * @minimum 1
   */
  messageId: number;
}
