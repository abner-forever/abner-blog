import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  todosControllerFindAll,
  todosControllerCreate,
  todosControllerUpdate,
  todosControllerRemove,
} from '@services/generated/todos/todos';
import type {
  TodoDto,
  CreateTodoDto,
  UpdateTodoDto,
} from '@services/generated/model';

interface TodoListResponse {
  todos: TodoDto[];
  stats: { total: number; completed: number; pending: number };
}

export const useTodos = () => {
  const queryClient = useQueryClient();

  const { data: todosData, isLoading } = useQuery<TodoListResponse>({
    queryKey: ['todos'],
    queryFn: async () => {
      const data =
        (await todosControllerFindAll()) as unknown as TodoListResponse;
      return data;
    },
  });

  const todos = todosData?.todos ?? [];
  const stats = todosData?.stats ?? { total: 0, completed: 0, pending: 0 };

  const addMutation = useMutation({
    mutationFn: (data: CreateTodoDto) => todosControllerCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & UpdateTodoDto) =>
      todosControllerUpdate(id.toString(), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => todosControllerRemove(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    todos,
    stats,
    isLoading,
    addTodo: addMutation.mutateAsync,
    updateTodo: updateMutation.mutateAsync,
    deleteTodo: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
};
