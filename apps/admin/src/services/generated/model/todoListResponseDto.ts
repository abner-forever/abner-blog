import type { TodoDto } from "./todoDto";
import type { TodoStatsDto } from "./todoStatsDto";

export interface TodoListResponseDto {
  /** 待办事项列表 */
  todos: TodoDto[];
  /** 统计数据 */
  stats: TodoStatsDto;
}
