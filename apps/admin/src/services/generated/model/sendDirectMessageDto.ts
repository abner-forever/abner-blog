export interface SendDirectMessageDto {
  /**
   * 文本内容
   * @maxLength 8000
   */
  content: string;
  /** 附件图片 URL 列表 */
  attachments?: string[];
}
