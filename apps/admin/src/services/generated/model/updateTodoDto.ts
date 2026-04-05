export interface UpdateTodoDto {
  /** 待办事项标题 */
  title?: string;
  /** 详细描述 */
  description?: string;
  /** 是否已完成 */
  completed?: boolean;
}
