import { useState } from 'react';
import {
  UnorderedListOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import TodoList from './TodoList';
import CalendarView from './CalendarView';
import './index.less';

const TodoPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'todo' | 'calendar'>('todo');

  return (
    <div className="todo-page-container">
      <div className="todo-tab-bar">
        <button
          className={`tab-btn ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          <UnorderedListOutlined />
          <span>{t('nav.todos')}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <CalendarOutlined />
          <span>{t('calendar.title')}</span>
        </button>
      </div>
      {activeTab === 'todo' ? <TodoList /> : <CalendarView />}
    </div>
  );
};

export default TodoPage;
