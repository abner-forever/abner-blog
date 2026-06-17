import { Checkbox, Tooltip, Popconfirm } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TodoDto } from '@services/generated/model';

interface TodoItemProps {
  todo: TodoDto;
  onToggle: (id: number) => void;
  onEdit: (todo: TodoDto) => void;
  onDelete: (id: number) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Checkbox
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="todo-checkbox"
      />
      <div className="todo-body">
        <div className="todo-title">{todo.title}</div>
        {todo.description && (
          <div className="todo-desc">{todo.description}</div>
        )}
        <div className="todo-meta">
          {todo.createdAt && (
            <span className="todo-time">
              <ClockCircleOutlined />
              {new Date(todo.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="todo-actions">
        <Tooltip title={t('todo.edit')}>
          <button
            type="button"
            className="action-btn edit"
            onClick={() => onEdit(todo)}
          >
            <EditOutlined />
          </button>
        </Tooltip>
        <Popconfirm
          title={t('todo.deleteConfirm', '确认删除？')}
          onConfirm={() => onDelete(todo.id)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <Tooltip title={t('todo.delete', '删除')}>
            <button type="button" className="action-btn delete">
              <DeleteOutlined />
            </button>
          </Tooltip>
        </Popconfirm>
      </div>
    </>
  );
};

export default TodoItem;
