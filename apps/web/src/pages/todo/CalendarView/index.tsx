import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { message, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewMonthGrid,
  createViewWeek,
  createViewDay,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
import 'temporal-polyfill/global';
import '@schedule-x/theme-default/dist/index.css';
import dayjs, { type Dayjs } from 'dayjs';
import Loading from '@/components/Loading';
import type { RootState } from '@/store';
import {
  calendarControllerFindAll,
  calendarControllerCreate,
  calendarControllerUpdate,
  calendarControllerRemove,
} from '@services/generated/calendar/calendar';
import {
  parseCalendarDate,
  toScheduleXEvent,
  temporalToDayjs,
  temporalZonedToDayjs,
  formatDateForBackend,
  calendarTypes,
  type CalendarEventData,
} from '../shared/utils';
import EventsPanel from './components/EventsPanel';
import EventFormModal from './components/EventFormModal';
import ContextMenu from './components/ContextMenu';
import { useCalendarDragAndDrop } from './hooks/useCalendarDragAndDrop';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  date?: Dayjs;
  time?: string;
}

const CalendarView: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { theme } = useSelector((state: RootState) => state.theme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [selectedDate, setSelectedDate] = useState<string>(
    Temporal.Now.plainDateISO().toString(),
  );
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventData | null>(
    null,
  );
  const [eventForm] = Form.useForm();
  const eventsService = useState(() => createEventsServicePlugin())[0];
  const currentTimePlugin = useState(() => createCurrentTimePlugin())[0];
  const calendarWrapperRef = useRef<HTMLDivElement>(null);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
  });

  // 使用 ref 存储事件数据，供 useCalendarApp 回调使用
  const eventsRef = useRef<CalendarEventData[]>([]);
  // 存储 eventsService ref，供 onRender 回调使用
  const eventsServiceRef = useRef(eventsService);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async (): Promise<CalendarEventData[]> => {
      const data = await calendarControllerFindAll();
      return (data as unknown as CalendarEventData[]) || [];
    },
  });

  // 保持 ref 与 state 同步
  eventsRef.current = events;
  eventsServiceRef.current = eventsService;

  // 将后端事件同步到 schedule-x（插件初始化后才可用 set）
  useEffect(() => {
    if (events.length > 0 && typeof eventsService.set === 'function') {
      eventsService.set(events.map(toScheduleXEvent));
    }
  }, [events, eventsService]);

  // 打开添加弹窗（可选预填日期和时间）
  const openAddModal = useCallback((date?: Dayjs, time?: string) => {
    setEditingEvent(null);
    eventForm.resetFields();
    const startDate = date || dayjs();
    eventForm.setFieldsValue({
      startDate: time ? startDate.hour(parseInt(time.split(':')[0])).minute(parseInt(time.split(':')[1])) : startDate,
      allDay: !time,
      color: '#8b5cf6',
    });
    setEventModalVisible(true);
  }, [eventForm]);

  // 右键菜单处理
  useEffect(() => {
    const wrapper = calendarWrapperRef.current;
    if (!wrapper) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // 尝试从点击位置找到对应的日期单元格
      const target = e.target as HTMLElement;
      const dayCell = target.closest(
        '.sx__month-grid-day, .sx__week-grid__date-column, .sx__day-grid__day',
      );

      if (dayCell) {
        // 尝试从 data 属性或内容中提取日期
        const dateAttr = dayCell.getAttribute('data-date') || dayCell.getAttribute('data-time');
        let clickDate = dayjs();
        let clickTime: string | undefined;

        if (dateAttr) {
          if (dateAttr.includes('T')) {
            const d = dayjs(dateAttr);
            clickDate = d.startOf('day');
            clickTime = d.format('HH:mm');
          } else {
            clickDate = dayjs(dateAttr);
          }
        }

        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          date: clickDate,
          time: clickTime,
        });
      }
    };

    wrapper.addEventListener('contextmenu', handleContextMenu);
    return () => wrapper.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const calendar = useCalendarApp(
    {
      locale: 'zh-CN',
      isDark,
      views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
      calendars: calendarTypes,
      dayBoundaries: {
        start: '06:00',
        end: '22:00',
      },
      weekOptions: {
        nDays: 7,
      },
      callbacks: {
        onSelectedDateUpdate: (date: Temporal.PlainDate) => {
          setSelectedDate(date.toString());
        },
        // 日历渲染完成后，同步事件（确保插件已初始化）
        onRender: () => {
          const svc = eventsServiceRef.current;
          const evts = eventsRef.current;
          if (evts.length > 0 && typeof svc.set === 'function') {
            svc.set(evts.map(toScheduleXEvent));
          }
        },
        onEventClick: (calendarEvent) => {
          const backendEvent = eventsRef.current.find(
            (e) => e.id?.toString() === calendarEvent._backendId?.toString(),
          );
          if (backendEvent) {
            setEditingEvent(backendEvent);
            eventForm.setFieldsValue({
              title: backendEvent.title,
              description: backendEvent.description,
              allDay: backendEvent.allDay ?? true,
              startDate: parseCalendarDate(backendEvent.startDate),
              endDate: backendEvent.endDate
                ? parseCalendarDate(backendEvent.endDate)
                : undefined,
              color: backendEvent.color || '#8b5cf6',
            });
            setEventModalVisible(true);
          }
        },
        // 点击日期（月视图）→ 新建全天事件
        onClickDate: (date: Temporal.PlainDate) => {
          setContextMenu((prev) => ({ ...prev, visible: false }));
          openAddModal(temporalToDayjs(date));
        },
        // 点击时间槽（周/日视图）→ 新建定时事件
        onClickDateTime: (dateTime: Temporal.ZonedDateTime) => {
          setContextMenu((prev) => ({ ...prev, visible: false }));
          const d = temporalZonedToDayjs(dateTime);
          openAddModal(d.startOf('day'), d.format('HH:mm'));
        },
      },
    },
    [eventsService, currentTimePlugin],
  );

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

  // 拖拽更新回调
  const handleDragUpdate = useCallback(
    (id: string, data: Partial<CalendarEventData>) => {
      updateMutation.mutate({ id, data });
    },
    [updateMutation],
  );

  // 自定义 HTML5 拖拽编辑日程（替代 schedule-x Premium 的拖拽插件）
  useCalendarDragAndDrop(
    calendarWrapperRef,
    events,
    { start: '06:00', end: '22:00' },
    handleDragUpdate,
  );

  if (isLoading) {
    return <Loading page />;
  }

  const selectedDateDayjs = temporalToDayjs(Temporal.PlainDate.from(selectedDate));

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
    openAddModal(selectedDateDayjs);
  };

  const handleOpenEdit = (event: CalendarEventData) => {
    setEditingEvent(event);
    eventForm.setFieldsValue({
      title: event.title,
      description: event.description,
      allDay: event.allDay ?? true,
      startDate: parseCalendarDate(event.startDate),
      endDate: event.endDate ? parseCalendarDate(event.endDate) : undefined,
      color: event.color || '#8b5cf6',
    });
    setEventModalVisible(true);
  };

  const handleEventSubmit = async () => {
    try {
      const values = await eventForm.validateFields();
      const allDay = values.allDay as boolean;
      const startDate = formatDateForBackend(values.startDate as Dayjs, allDay);
      const endDate = values.endDate
        ? formatDateForBackend(values.endDate as Dayjs, allDay)
        : undefined;

      const eventData: Partial<CalendarEventData> = {
        title: values.title,
        description: values.description,
        allDay,
        startDate,
        endDate,
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

  const selectedDateEvents = getEventsForDate(selectedDateDayjs);

  return (
    <div className="calendar-section">
      <div className="calendar-layout">
        <div className="calendar-card" ref={calendarWrapperRef}>
          <ScheduleXCalendar calendarApp={calendar} />
        </div>

        <EventsPanel
          selectedDateDayjs={selectedDateDayjs}
          events={events}
          selectedDateEvents={selectedDateEvents}
          onAdd={handleOpenAdd}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteEvent}
        />
      </div>

      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        dateLabel={contextMenu.date?.format('YYYY-MM-DD')}
        timeLabel={contextMenu.time}
        onAddEvent={() => {
          setContextMenu((prev) => ({ ...prev, visible: false }));
          openAddModal(contextMenu.date, contextMenu.time);
        }}
        onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
      />

      <EventFormModal
        visible={eventModalVisible}
        editingEvent={editingEvent}
        form={eventForm}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleEventSubmit}
        onCancel={() => setEventModalVisible(false)}
      />
    </div>
  );
};

export default CalendarView;
