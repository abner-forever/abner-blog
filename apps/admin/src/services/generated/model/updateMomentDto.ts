export interface UpdateMomentDto {
  /**
   * 沸点内容（最多1000字）
   * @maxLength 1000
   */
  content?: string;
  /** 图片 URL 列表 */
  images?: string[];
  /**
   * 话题 ID
   * @minimum 1
   */
  topicId?: number;
}
