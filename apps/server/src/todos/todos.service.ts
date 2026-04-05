import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private todosRepository: Repository<Todo>,
  ) {}

  async create(
    createTodoDto: CreateTodoDto,
    userId: number,
  ): Promise<Omit<Todo, 'user'>> {
    const todo = this.todosRepository.create({
      ...createTodoDto,
      user: { id: userId },
    });
    const savedTodo = await this.todosRepository.save(todo);

    // 返回不包含user信息的数据
    return {
      id: savedTodo.id,
      title: savedTodo.title,
      description: savedTodo.description || '',
      completed: savedTodo.completed,
      createdAt: savedTodo.createdAt,
      updatedAt: savedTodo.updatedAt,
    };
  }

  async findAll(userId: number): Promise<{
    todos: Todo[];
    stats: {
      total: number;
      completed: number;
      pending: number;
    };
  }> {
    const todos = await this.todosRepository.find({
      where: { user: { id: userId } },
      order: {
        completed: 'ASC', // 未完成的在前面
        createdAt: 'DESC', // 最新的在前面
      },
    });

    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const pending = total - completed;

    return {
      todos,
      stats: {
        total,
        completed,
        pending,
      },
    };
  }

  async findOne(id: number, userId: number): Promise<Todo> {
    const todo = await this.todosRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!todo) {
      throw new NotFoundException('待办事项不存在');
    }

    if (todo.user.id !== userId) {
      throw new ForbiddenException('您没有权限访问此待办事项');
    }

    return todo;
  }

  async update(
    id: number,
    updateTodoDto: UpdateTodoDto,
    userId: number,
  ): Promise<Omit<Todo, 'user'>> {
    // 先验证权限
    await this.findOne(id, userId);

    // 直接更新，不加载关联数据
    await this.todosRepository.update(
      { id, user: { id: userId } },
      updateTodoDto,
    );

    // 返回更新后的数据，但不包含user信息
    const updatedTodo = await this.todosRepository.findOne({
      where: { id },
      select: [
        'id',
        'title',
        'description',
        'completed',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!updatedTodo) {
      throw new NotFoundException('待办事项不存在');
    }

    return {
      ...updatedTodo,
      description: updatedTodo.description || '',
    };
  }

  async remove(id: number, userId: number): Promise<void> {
    const todo = await this.findOne(id, userId);
    await this.todosRepository.remove(todo);
  }

  async toggleComplete(
    id: number,
    userId: number,
  ): Promise<Omit<Todo, 'user'>> {
    // 先验证权限
    await this.findOne(id, userId);

    // 切换状态
    await this.todosRepository.update(
      { id, user: { id: userId } },
      { completed: () => 'NOT completed' }, // SQL: completed = NOT completed
    );

    // 返回更新后的数据，但不包含user信息
    const updatedTodo = await this.todosRepository.findOne({
      where: { id },
      select: ['id', 'title', 'completed', 'createdAt', 'updatedAt'],
    });

    if (!updatedTodo) {
      throw new NotFoundException('待办事项不存在');
    }

    return updatedTodo;
  }
}
