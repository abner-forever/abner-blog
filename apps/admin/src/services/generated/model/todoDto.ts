export interface TodoDto {
  /** 待办事项 ID */
  id: number;
  /** 标题 */
  title: string;
  /**
   * 详细描述
   * @nullable
   */
  description?: string | null;
  /** 是否已完成 */
  completed: boolean;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}
