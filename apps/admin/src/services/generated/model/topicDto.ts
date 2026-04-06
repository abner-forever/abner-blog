export interface TopicDto {
  /** 话题 ID */
  id: number;
  /** 话题名称 */
  name: string;
  /**
   * 话题描述
   * @nullable
   */
  description?: string | null;
  /**
   * 话题图标
   * @nullable
   */
  icon?: string | null;
  /**
   * 话题颜色
   * @nullable
   */
  color?: string | null;
  /** 沸点数量 */
  momentCount: number;
  /** 关注数量 */
  followCount: number;
  /** 创建时间 */
  createdAt: string;
}
