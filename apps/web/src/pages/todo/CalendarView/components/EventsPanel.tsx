import { Popconfirm, Tooltip } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Dayjs } from 'dayjs';
import { parseCalendarDate, type CalendarEventData } from '../../shared/utils';

interface EventsPanelProps {
  selectedDateDayjs: Dayjs;
  events: CalendarEventData[];
  selectedDateEvents: CalendarEventData[];
  onAdd: () => void;
  onEdit: (event: CalendarEventData) => void;
  onDelete: (id: string | number) => void;
}

/** 格式化事件时间显示 */
const formatEventTime = (event: CalendarEventData): string | null => {
  if (event.allDay) return null;

  const hasStart = event.startDate && event.startDate.includes('T');
  const hasEnd = event.endDate && event.endDate.includes('T');

  if (hasStart) {
    const start = parseCalendarDate(event.startDate);
    const startStr = start.format('HH:mm');
    if (hasEnd) {
      const end = parseCalendarDate(event.endDate);
      return `${startStr} - ${end.format('HH:mm')}`;
    }
    return startStr;
  }
  return null;
};

const EventsPanel: React.FC<EventsPanelProps> = ({
  selectedDateDayjs,
  events,
  selectedDateEvents,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="events-panel">
      <div className="events-panel-header">
        <div className="events-date-info">
          <div className="events-date">{selectedDateDayjs.format('D')}</div>
          <div className="events-date-meta">
            <div className="events-month-year">
              {selectedDateDayjs.format('YYYY年M月')}
            </div>
            <div className="events-weekday">
              {selectedDateDayjs.format('dddd')}
            </div>
          </div>
        </div>
        <button className="btn-add-event" onClick={onAdd}>
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
            <button className="events-empty-add" onClick={onAdd}>
              {t('calendar.noEventsAdd')}
            </button>
          </div>
        ) : (
          selectedDateEvents.map((event) => {
            const timeStr = formatEventTime(event);
            return (
              <Tooltip
                key={event.id}
                title="拖拽日历中的事件可调整日期和时间"
                placement="left"
                mouseEnterDelay={0.8}
              >
                <div className="event-item">
                  <div className="event-drag-handle">
                    <DragOutlined />
                  </div>
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
                    {timeStr && (
                      <div className="event-time">
                        <ClockCircleOutlined />
                        <span>{timeStr}</span>
                      </div>
                    )}
                    {event.endDate && event.endDate !== event.startDate && (
                      <div className="event-range">
                        <CalendarOutlined />
                        {event.allDay
                          ? `${parseCalendarDate(event.startDate).format('M/D')} ~ ${parseCalendarDate(event.endDate).format('M/D')}`
                          : `${parseCalendarDate(event.startDate).format('M/D HH:mm')} ~ ${parseCalendarDate(event.endDate).format('M/D HH:mm')}`}
                      </div>
                    )}
                  </div>
                  <div className="event-item-actions">
                    <button
                      className="event-action-btn"
                      onClick={() => onEdit(event)}
                    >
                      <EditOutlined />
                    </button>
                    <Popconfirm
                      title={t('calendar.deleteConfirm')}
                      onConfirm={() =>
                        event.id && onDelete(event.id)
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
              </Tooltip>
            );
          })
        )}
      </div>

      {/* 本月事件概览 */}
      {events.length > 0 && (
        <div className="month-summary">
          <div className="month-summary-title">
            {t('calendar.monthEventsCount', {
              count: events.filter((e) =>
                parseCalendarDate(e.startDate).isSame(selectedDateDayjs, 'month'),
              ).length,
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPanel;
