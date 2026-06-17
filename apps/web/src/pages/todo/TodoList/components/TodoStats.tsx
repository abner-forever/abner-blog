import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface TodoStatsProps {
  totalCount: number;
  completedCount: number;
  activeCount: number;
  progressPercent: number;
}

const TodoStats: React.FC<TodoStatsProps> = ({
  totalCount,
  completedCount,
  activeCount,
  progressPercent,
}) => {
  const { t } = useTranslation();

  return (
    <div className="todo-stats-bar">
      <div className="stats-numbers">
        <div className="stat-item">
          <BarsOutlined className="stat-icon total" />
          <span className="stat-value">{totalCount}</span>
          <span className="stat-label">{t('todo.total')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <ClockCircleOutlined className="stat-icon active" />
          <span className="stat-value">{activeCount}</span>
          <span className="stat-label">{t('todo.remaining')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <CheckCircleOutlined className="stat-icon done" />
          <span className="stat-value">{completedCount}</span>
          <span className="stat-label">{t('todo.completed')}</span>
        </div>
      </div>
      {totalCount > 0 && (
        <div className="stats-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-text">{progressPercent}%</span>
        </div>
      )}
    </div>
  );
};

export default TodoStats;
