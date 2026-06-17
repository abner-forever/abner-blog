import { useState } from 'react';
import classNames from 'classnames';
import { message, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import DataList from '@/components/DataList';
import Loading from '@/components/Loading';
import CustomEmpty from '@/components/CustomEmpty';
import { useTodos } from '@/hooks/useTodos';
import type { TodoDto } from '@services/generated/model';
import TodoStats from './components/TodoStats';
import TodoAddForm from './components/TodoAddForm';
import TodoFilterBar from './components/TodoFilterBar';
import TodoItem from './components/TodoItem';
import EditTodoModal from './components/EditTodoModal';

const TodoList: React.FC = () => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoDto | null>(null);
  const [editForm] = Form.useForm();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const { todos, isLoading, addTodo, updateTodo, deleteTodo, isAdding } =
    useTodos();

  const sortedTodos = [...todos].sort((a, b) => b.id - a.id);
  const filteredTodos = sortedTodos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  if (isLoading) {
    return <Loading page />;
  }

  const totalCount = sortedTodos.length;
  const completedCount = sortedTodos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddTodo = async () => {
    if (!inputValue.trim()) {
      message.warning(t('todo.pleaseEnterContent'));
      return;
    }
    try {
      await addTodo({
        title: inputValue,
        description: descriptionValue || undefined,
      });
      setInputValue('');
      setDescriptionValue('');
      setIsFormExpanded(false);
      message.success(t('todo.addSuccess'));
    } catch {
      message.error(t('todo.addFailed'));
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setDescriptionValue('');
    setIsFormExpanded(false);
  };

  const handleToggleTodo = async (id: number) => {
    try {
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;
      await updateTodo({ id, completed: !todo.completed });
    } catch {
      message.error(t('todo.updateFailed'));
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      message.success(t('todo.deleteSuccess'));
    } catch {
      message.error(t('todo.deleteFailed'));
    }
  };

  const handleEditClick = (todo: TodoDto) => {
    setEditingTodo(todo);
    editForm.setFieldsValue({
      title: todo.title,
      description: todo.description || '',
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingTodo) return;
      await updateTodo({
        id: editingTodo.id,
        title: values.title,
        description: values.description || undefined,
      });
      setEditModalVisible(false);
      message.success(t('todo.updateSuccess'));
    } catch {
      message.error(t('todo.updateFailed'));
    }
  };

  return (
    <div className="todo-list-section">
      <TodoStats
        totalCount={totalCount}
        completedCount={completedCount}
        activeCount={activeCount}
        progressPercent={progressPercent}
      />

      <TodoAddForm
        inputValue={inputValue}
        descriptionValue={descriptionValue}
        isFormExpanded={isFormExpanded}
        isAdding={isAdding}
        onInputChange={setInputValue}
        onDescriptionChange={setDescriptionValue}
        onExpand={setIsFormExpanded}
        onAdd={handleAddTodo}
        onCancel={handleCancel}
      />

      {totalCount > 0 && (
        <TodoFilterBar
          filter={filter}
          totalCount={totalCount}
          activeCount={activeCount}
          completedCount={completedCount}
          onFilterChange={setFilter}
        />
      )}

      <div className="todo-list-wrapper">
        {filteredTodos.length === 0 ? (
          <div className="todo-empty">
            <CustomEmpty
              tip={
                filter === 'completed'
                  ? t('todo.emptyCompleted')
                  : filter === 'active'
                    ? t('todo.emptyActive')
                    : t('todo.emptyAll')
              }
            />
          </div>
        ) : (
          <DataList
            className="todo-list-body"
            dataSource={filteredTodos}
            rowKey={(todo) => todo.id}
            rowClassName={(todo) =>
              classNames('todo-item', { 'is-completed': todo.completed })
            }
            renderItem={(todo) => (
              <TodoItem
                todo={todo}
                onToggle={handleToggleTodo}
                onEdit={handleEditClick}
                onDelete={handleDeleteTodo}
              />
            )}
          />
        )}
      </div>

      <EditTodoModal
        visible={editModalVisible}
        editingTodo={editingTodo}
        form={editForm}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
      />
    </div>
  );
};

export default TodoList;
