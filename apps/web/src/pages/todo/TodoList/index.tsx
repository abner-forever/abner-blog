import { useState } from 'react';
import classNames from 'classnames';
import {
  Input,
  Checkbox,
  message,
  Tag,
  Modal,
  Form,
  Calendar,
  Badge,
  Row,
  Col,
  DatePicker,
  Tooltip,
  Select,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DataList from '@/components/DataList';
import {
  calendarControllerFindAll,
  calendarControllerCreate,
  calendarControllerUpdate,
  calendarControllerRemove,
} from '@services/generated/calendar/calendar';

interface CalendarEventData {
  id?: string;
  title: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
  completed?: boolean;
  type?: string;
  description?: string;
}
import dayjs, { type Dayjs } from 'dayjs';
import Loading from '@/components/Loading';
import CustomEmpty from '@/components/CustomEmpty';
import { useTodos } from '@/hooks/useTodos';
import type { TodoDto } from '@services/generated/model';
import './index.less';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const { TextArea } = Input;

const parseCalendarDate = (value?: string): Dayjs => {
  if (!value) return dayjs('');
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return dayjs(datePart);
  }
  return dayjs(value);
};

// 预定义颜色选项
const colorOptions = [
  { value: '#8b5cf6', label: '紫色' },
  { value: '#3b82f6', label: '蓝色' },
  { value: '#10b981', label: '绿色' },
  { value: '#f59e0b', label: '橙色' },
  { value: '#ef4444', label: '红色' },
  { value: '#ec4899', label: '粉色' },
  { value: '#06b6d4', label: '青色' },
  { value: '#6366f1', label: '靛蓝' },
];

// 颜色选择器自定义组件（配合 Form.Item 使用）
interface ColorPickerFieldProps {
  value?: string;
  onChange?: (value: string) => void;
}

const ColorPickerField: React.FC<ColorPickerFieldProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="color-picker-field">
      {colorOptions.map((color) => (
        <Tooltip key={color.value} title={color.label}>
          <div
            className={`color-option ${value === color.value ? 'selected' : ''}`}
            style={{ backgroundColor: color.value }}
            onClick={() => onChange?.(color.value)}
          >
            {value === color.value && <span className="check-icon">✓</span>}
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

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

// ─── Todo List Component ─────────────────────────────────────────────────────

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
      {/* 统计信息 */}
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

      {/* 添加表单 */}
      <div className={`todo-add-card ${isFormExpanded ? 'expanded' : ''}`}>
        <div className="add-input-row">
          <PlusOutlined className="add-icon" />
          <input
            className="add-main-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('todo.title') + '...'}
            onFocus={() => setIsFormExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddTodo();
              }
              if (e.key === 'Escape') handleCancel();
            }}
            disabled={isAdding}
          />
          {!isFormExpanded && (
            <button
              className="add-quick-btn"
              onClick={() => {
                if (inputValue.trim()) {
                  handleAddTodo();
                } else {
                  setIsFormExpanded(true);
                }
              }}
            >
              {t('todo.add')}
            </button>
          )}
        </div>

        <div className={`add-expanded ${isFormExpanded ? 'visible' : ''}`}>
          <textarea
            className="add-desc-input"
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder={
              t('todo.description') +
              '... (' +
              t('common.optional', '可选') +
              ')'
            }
            rows={2}
            disabled={isAdding}
          />
          <div className="add-actions">
            <button className="btn-cancel" onClick={handleCancel}>
              {t('common.cancel')}
            </button>
            <button
              className="btn-confirm"
              onClick={handleAddTodo}
              disabled={isAdding}
            >
              {isAdding ? '...' : t('todo.add')}
            </button>
          </div>
        </div>
      </div>

      {/* 过滤栏 */}
      {totalCount > 0 && (
        <div className="todo-filter-bar">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
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
      )}

      {/* 待办列表 */}
      <div className="todo-list-wrapper">
        {filteredTodos.length === 0 ? (
          <div className="todo-empty">
            <CustomEmpty
              tip={
                filter === 'completed'
                  ? '还没有完成的事项'
                  : filter === 'active'
                    ? '太棒了！没有待办事项 ✨'
                    : '从上面添加第一个待办吧～'
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
              <>
                <Checkbox
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
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
                      onClick={() => handleEditClick(todo)}
                    >
                      <EditOutlined />
                    </button>
                  </Tooltip>
                  <Popconfirm
                    title={t('todo.deleteConfirm', '确认删除？')}
                    onConfirm={() => handleDeleteTodo(todo.id)}
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
            )}
          />
        )}
      </div>

      {/* 编辑弹窗 */}
      <Modal
        title={t('todo.edit')}
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="title"
            label={t('todo.title')}
            rules={[{ required: true, message: t('todo.pleaseEnterContent') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('todo.description')}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ─── Calendar View Component ─────────────────────────────────────────────────

const CalendarView: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(
    null,
  );
  const [eventForm] = Form.useForm();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async (): Promise<CalendarEventData[]> => {
      const data = await calendarControllerFindAll();
      return (data as unknown as CalendarEventData[]) || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CalendarEventData) =>
      calendarControllerCreate(
        data as Parameters<typeof calendarControllerCreate>[0],
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      message.success(t('calendar.addSuccess'));
    },
    onError: () => {
      message.error(t('calendar.addFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CalendarEventData>;
    }) =>
      calendarControllerUpdate(
        id,
        data as Parameters<typeof calendarControllerUpdate>[1],
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      message.success(t('calendar.updateSuccess'));
    },
    onError: () => {
      message.error(t('calendar.updateFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarControllerRemove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      message.success(t('calendar.deleteSuccess'));
    },
    onError: () => {
      message.error(t('calendar.deleteFailed'));
    },
  });

  if (isLoading) {
    return <Loading page />;
  }

  const getEventsForDate = (date: Dayjs) => {
    return events.filter((event) => {
      const currentDay = date.startOf('day');
      const startDay = parseCalendarDate(event.startDate).startOf('day');
      const endDay = (
        event.endDate ? parseCalendarDate(event.endDate) : startDay
      ).startOf('day');
      return !currentDay.isBefore(startDay) && !currentDay.isAfter(endDay);
    });
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    eventForm.resetFields();
    eventForm.setFieldsValue({
      startDate: selectedDate,
      color: '#8b5cf6',
    });
    setEventModalVisible(true);
  };

  const handleOpenEdit = (event: CalendarEventData) => {
    setEditingEvent(event);
    eventForm.setFieldsValue({
      title: event.title,
      description: event.description,
      startDate: parseCalendarDate(event.startDate),
      endDate: event.endDate ? parseCalendarDate(event.endDate) : undefined,
      color: event.color || '#8b5cf6',
    });
    setEventModalVisible(true);
  };

  const handleEventSubmit = async () => {
    try {
      const values = await eventForm.validateFields();
      const eventData: Partial<CalendarEventData> = {
        title: values.title,
        description: values.description,
        startDate: (values.startDate as Dayjs).format('YYYY-MM-DD'),
        endDate: values.endDate
          ? (values.endDate as Dayjs).format('YYYY-MM-DD')
          : undefined,
        color: values.color as string,
      };

      if (editingEvent?.id) {
        updateMutation.mutate({
          id: editingEvent.id.toString(),
          data: eventData,
        });
      } else {
        createMutation.mutate(eventData as CalendarEventData);
      }
      setEventModalVisible(false);
    } catch {
      // 表单验证失败
    }
  };

  const handleDeleteEvent = (id: string | number) => {
    deleteMutation.mutate(id.toString());
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const currentYear = dayjs().year();
  const yearOptions = Array.from(
    { length: 21 },
    (_, index) => currentYear - 10 + index,
  );
  const monthOptions = Array.from({ length: 12 }, (_, index) => index);

  const updateCalendarDate = (nextDate: Dayjs) => {
    setSelectedDate(nextDate);
  };

  const handleGoToday = () => {
    updateCalendarDate(dayjs());
  };

  function dateCellRender(date: Dayjs) {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;

    return (
      <div className="calendar-event-list">
        {dayEvents.slice(0, 2).map((event) => (
          <div
            key={event.id}
            className="event-text-item"
            style={{ backgroundColor: event.color || '#8b5cf6' }}
            title={event.title}
          >
            {event.title}
          </div>
        ))}
        {dayEvents.length > 2 && (
          <span className="more-events">+{dayEvents.length - 2}</span>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-section">
      <Row gutter={[20, 20]} align="top">
        <Col xs={24} lg={15} xl={16}>
          <div className="calendar-card">
            <Calendar
              value={selectedDate}
              onSelect={updateCalendarDate}
              onPanelChange={updateCalendarDate}
              headerRender={({ value, type, onChange, onTypeChange }) => (
                <div className="calendar-custom-header">
                  <div className="calendar-nav-actions">
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={() => {
                        const nextValue = value.clone().add(-1, 'month');
                        onChange(nextValue);
                        updateCalendarDate(nextValue);
                      }}
                      aria-label={t('calendar.prevMonth')}
                    >
                      <LeftOutlined />
                    </button>
                    <button
                      type="button"
                      className="calendar-today-btn"
                      onClick={handleGoToday}
                    >
                      {t('calendar.today')}
                    </button>
                    <button
                      type="button"
                      className="calendar-nav-btn"
                      onClick={() => {
                        const nextValue = value.clone().add(1, 'month');
                        onChange(nextValue);
                        updateCalendarDate(nextValue);
                      }}
                      aria-label={t('calendar.nextMonth')}
                    >
                      <RightOutlined />
                    </button>
                  </div>

                  <div className="calendar-header-selects">
                    <Select
                      size="middle"
                      value={value.year()}
                      onChange={(newYear: number) => {
                        const nextValue = value.clone().year(newYear);
                        onChange(nextValue);
                        updateCalendarDate(nextValue);
                      }}
                      options={yearOptions.map((year) => ({
                        value: year,
                        label: `${year}${t('calendar.yearUnit')}`,
                      }))}
                      popupMatchSelectWidth={false}
                    />
                    <Select
                      size="middle"
                      value={value.month()}
                      onChange={(newMonth: number) => {
                        const nextValue = value.clone().month(newMonth);
                        onChange(nextValue);
                        updateCalendarDate(nextValue);
                      }}
                      options={monthOptions.map((month) => ({
                        value: month,
                        label: `${month + 1}${t('calendar.monthUnit')}`,
                      }))}
                      popupMatchSelectWidth={false}
                    />
                    <div className="calendar-mode-switch" role="tablist">
                      <button
                        type="button"
                        className={`mode-btn ${type === 'month' ? 'active' : ''}`}
                        onClick={() => onTypeChange('month')}
                      >
                        {t('calendar.monthMode')}
                      </button>
                      <button
                        type="button"
                        className={`mode-btn ${type === 'year' ? 'active' : ''}`}
                        onClick={() => onTypeChange('year')}
                      >
                        {t('calendar.yearMode')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              cellRender={(current, info) => {
                if (info.type === 'date') return dateCellRender(current);
                // 年视图月格只显示月份标题，不重复渲染 originNode
                return null;
              }}
            />
          </div>
        </Col>

        <Col xs={24} lg={9} xl={8}>
          <div className="events-panel">
            <div className="events-panel-header">
              <div className="events-date-info">
                <div className="events-date">{selectedDate.format('D')}</div>
                <div className="events-date-meta">
                  <div className="events-month-year">
                    {selectedDate.format('YYYY年M月')}
                  </div>
                  <div className="events-weekday">
                    {selectedDate.format('dddd')}
                  </div>
                </div>
              </div>
              <button className="btn-add-event" onClick={handleOpenAdd}>
                <PlusOutlined />
                <span>{t('calendar.add')}</span>
              </button>
            </div>

            <div className="events-list">
              {selectedDateEvents.length === 0 ? (
                <div className="events-empty">
                  <div className="events-empty-icon">📅</div>
                  <div className="events-empty-text">
                    {t('calendar.noEvents')}
                  </div>
                  <button className="events-empty-add" onClick={handleOpenAdd}>
                    + 添加日程
                  </button>
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div
                      className="event-stripe"
                      style={{ backgroundColor: event.color || '#8b5cf6' }}
                    />
                    <div className="event-content">
                      <div className="event-title" title={event.title}>
                        {event.title}
                      </div>
                      {event.description && (
                        <div className="event-desc">{event.description}</div>
                      )}
                      {event.endDate && event.endDate !== event.startDate && (
                        <div className="event-range">
                          <CalendarOutlined />
                          {parseCalendarDate(event.startDate).format('M/D')} ~{' '}
                          {parseCalendarDate(event.endDate).format('M/D')}
                        </div>
                      )}
                    </div>
                    <div className="event-item-actions">
                      <button
                        className="event-action-btn"
                        onClick={() => handleOpenEdit(event)}
                      >
                        <EditOutlined />
                      </button>
                      <Popconfirm
                        title="确认删除此日程？"
                        onConfirm={() =>
                          event.id && handleDeleteEvent(event.id)
                        }
                        okText={t('common.confirm')}
                        cancelText={t('common.cancel')}
                      >
                        <button className="event-action-btn danger">
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 本月事件概览 */}
            {events.length > 0 && (
              <div className="month-summary">
                <div className="month-summary-title">
                  <Badge status="processing" />
                  本月共{' '}
                  {
                    events.filter((e) =>
                      parseCalendarDate(e.startDate).isSame(selectedDate, 'month'),
                    ).length
                  }{' '}
                  个日程
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* 日程编辑弹窗 */}
      <Modal
        title={
          <div className="modal-title">
            <CalendarOutlined />
            <span>{editingEvent ? t('calendar.edit') : t('calendar.add')}</span>
          </div>
        }
        open={eventModalVisible}
        onOk={handleEventSubmit}
        onCancel={() => setEventModalVisible(false)}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={480}
      >
        <Form form={eventForm} layout="vertical" className="event-form">
          <Form.Item
            name="title"
            label={t('calendar.eventTitle')}
            rules={[{ required: true, message: '请输入日程标题' }]}
          >
            <Input placeholder="日程标题" size="large" />
          </Form.Item>

          <Form.Item name="description" label={t('calendar.description')}>
            <TextArea rows={2} placeholder="描述（可选）" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label={t('calendar.startDate')}
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label={t('calendar.endDate')}>
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="结束日期（可选）"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="color" label="颜色标记" initialValue="#8b5cf6">
            <ColorPickerField />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TodoPage;
