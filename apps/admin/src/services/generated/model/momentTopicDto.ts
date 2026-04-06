export interface MomentTopicDto {
  /** 话题 ID */
  id: number;
  /** 话题名称 */
  name: string;
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
}
