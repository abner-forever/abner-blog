export interface UpdateMomentDto {
  /** 沸点内容（最多1000字） */
  content?: string;
  /** 图片 URL 列表 */
  images?: string[];
  /** 话题 ID */
  topicId?: number;
}
