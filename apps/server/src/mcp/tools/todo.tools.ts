import { Injectable, Logger } from '@nestjs/common';
import { TodosService } from '../../todos/todos.service';
import type {
  ListTodosInput,
  CreateTodoInput,
  UpdateTodoInput,
  DeleteTodoInput,
} from '../schemas';

@Injectable()
export class TodoTools {
  private readonly logger = new Logger(TodoTools.name);

  constructor(private readonly todosService: TodosService) {}

  /**
   * 列出待办事项
   */
  async listTodos(params: ListTodosInput) {
    try {
      const userId = this.getCurrentUserId();

      // 查询所有待办
      const result = await this.todosService.findAll(userId);

      let todos = result.todos || [];

      // 根据 completed 筛选
      if (params.completed !== undefined) {
        todos = todos.filter((t) => t.completed === params.completed);
      }

      if (todos.length === 0) {
        const filterText =
          params.completed === true
            ? '已完成'
            : params.completed === false
              ? '未完成'
              : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `没有找到${filterText}的待办事项。`,
            },
          ],
          structuredContent: { todos: [], total: 0 },
        };
      }

      const completedCount = todos.filter((t) => t.completed).length;
      const pendingCount = todos.length - completedCount;

      const todosText = todos
        .map(
          (t) =>
            `- ${t.title}${t.completed ? ' [已完成]' : ''}${t.description ? `: ${t.description}` : ''}`,
        )
        .join('\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `待办事项（共 ${todos.length} 项，${pendingCount} 项未完成，${completedCount} 项已完成）：\n${todosText}`,
          },
        ],
        structuredContent: {
          todos: todos.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            completed: t.completed,
            createdAt: t.createdAt,
          })),
          total: todos.length,
          completedCount,
          pendingCount,
        },
      };
    } catch (error) {
      this.logger.error(`listTodos tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `查询待办时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 创建待办事项
   */
  async createTodo(params: CreateTodoInput) {
    try {
      const userId = this.getCurrentUserId();

      const todo = await this.todosService.create(
        { title: params.title, description: params.description },
        userId,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: `待办创建成功：${todo.title}${todo.description ? ` (${todo.description})` : ''}`,
          },
        ],
        structuredContent: {
          id: todo.id,
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
          createdAt: todo.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`createTodo tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `创建待办时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 更新待办事项
   */
  async updateTodo(params: UpdateTodoInput) {
    try {
      const userId = this.getCurrentUserId();

      const updateData: Record<string, unknown> = {};
      if (params.title !== undefined) updateData.title = params.title;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.completed !== undefined)
        updateData.completed = params.completed;

      const todo = await this.todosService.update(
        params.id,
        updateData,
        userId,
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: `待办更新成功：${todo.title}${todo.completed ? ' [已完成]' : ''}`,
          },
        ],
        structuredContent: {
          id: todo.id,
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
        },
      };
    } catch (error) {
      this.logger.error(`updateTodo tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `更新待办时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 删除待办事项
   */
  async deleteTodo(params: DeleteTodoInput) {
    try {
      const userId = this.getCurrentUserId();

      await this.todosService.remove(params.id, userId);

      return {
        content: [
          {
            type: 'text' as const,
            text: `待办删除成功（ID: ${params.id}）`,
          },
        ],
        structuredContent: {
          deletedId: params.id,
          success: true,
        },
      };
    } catch (error) {
      this.logger.error(`deleteTodo tool error: ${error}`);
      return {
        content: [
          {
            type: 'text' as const,
            text: `删除待办时出错: ${error instanceof Error ? error.message : '未知错误'}`,
          },
        ],
      };
    }
  }

  /**
   * 获取当前用户 ID（需要从请求上下文获取）
   */
  private getCurrentUserId(): number {
    // TODO: 从请求上下文获取真实用户 ID
    return 1;
  }
}
