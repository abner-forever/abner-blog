export interface AdminCreateTopicDto {
  /** 话题名称 */
  name: string;
  /** 话题描述 */
  description?: string;
  /** 封面图片 URL */
  cover?: string;
  /** 是否热门 */
  isHot?: boolean;
}
