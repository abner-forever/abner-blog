import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';

type FilterType = 'all' | 'active' | 'completed';

interface TodoFilterBarProps {
  filter: FilterType;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  onFilterChange: (filter: FilterType) => void;
}

const TodoFilterBar: React.FC<TodoFilterBarProps> = ({
  filter,
  totalCount,
  activeCount,
  completedCount,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="todo-filter-bar">
      {(['all', 'active', 'completed'] as const).map((f) => (
        <button
          key={f}
          className={`filter-btn ${filter === f ? 'active' : ''}`}
          onClick={() => onFilterChange(f)}
        >
          {f === 'all'
            ? t('todo.all', '全部')
            : f === 'active'
              ? t('todo.remaining')
              : t('todo.completed')}
          <Tag className="filter-count">
            {f === 'all'
              ? totalCount
              : f === 'active'
                ? activeCount
                : completedCount}
          </Tag>
        </button>
      ))}
    </div>
  );
};

export default TodoFilterBar;
