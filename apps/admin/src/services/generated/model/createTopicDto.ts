export interface CreateTopicDto {
  /** 话题名称 */
  name: string;
  /** 话题描述 */
  description?: string;
  /** 话题图标 */
  icon?: string;
}
