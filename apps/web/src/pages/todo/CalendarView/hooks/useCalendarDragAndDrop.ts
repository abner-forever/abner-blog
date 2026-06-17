import { useEffect, useRef } from 'react';
import type { CalendarEventData } from '../../shared/utils';

interface DragState {
  eventId: string;
  backendEvent: CalendarEventData;
  element: HTMLElement;
  isTimed: boolean;
  isResize: boolean;
}

interface DayBoundaries {
  start: string; // 'HH:mm'
  end: string;   // 'HH:mm'
}

/**
 * 为 schedule-x v4 日历实现自定义 HTML5 拖拽编辑日程。
 * schedule-x v4 将拖拽和调整大小功能移至 Premium 付费版本 (@sx-premium/drag-and-drop)，
 * 此 Hook 通过原生 HTML5 Drag & Drop API 实现相同功能。
 *
 * 支持：
 * - 月视图拖拽：将事件拖到其他日期，定时事件保留原时间
 * - 周/日视图拖拽：根据 Y 坐标计算新时间，保留持续时间
 * - 拖拽底部手柄调整时长（周/日视图更新结束时间，月视图更新结束日期）
 */
export function useCalendarDragAndDrop(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  events: CalendarEventData[],
  dayBoundaries: DayBoundaries,
  onUpdate: (id: string, data: Partial<CalendarEventData>) => void,
): void {
  const dragState = useRef<DragState | null>(null);
  const eventMap = useRef<Map<string, CalendarEventData>>(new Map());

  // 保持事件映射最新
  useEffect(() => {
    const map = new Map<string, CalendarEventData>();
    events.forEach((e) => {
      if (e.id) map.set(String(e.id), e);
    });
    eventMap.current = map;
  }, [events]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    /* ===================== 工具函数 ===================== */

    /** 查找最近的拖放目标元素 */
    const findDropTarget = (el: HTMLElement): HTMLElement | null =>
      el.closest(
        '[data-date-grid-date], [data-time-grid-date], [data-date]',
      ) as HTMLElement | null;

    /** 获取目标数据属性中的日期 */
    const getDropDate = (target: HTMLElement): string | null =>
      target.getAttribute('data-date-grid-date')
      ?? target.getAttribute('data-time-grid-date')
      ?? target.getAttribute('data-date');

    /** 使日历内所有事件可拖拽 */
    const enableDraggable = () => {
      wrapper.querySelectorAll<HTMLElement>('[data-event-id]').forEach((el) => {
        if (el.getAttribute('draggable') !== 'true') {
          el.setAttribute('draggable', 'true');
        }
      });
    };

    /**
     * 根据时间网格内的 Y 坐标计算时间。
     *
     * 周/日视图中，时间列元素（.sx__time-grid-day）带 data-time-grid-date 属性，
     * 其 clientHeight 表示 dayBoundaries 范围内的全部高度。
     * 公式：时间 = clientY 在列内的相对位置占总高度的比例 x 总分钟数
     */
    const calcTimeFromY = (target: HTMLElement, clientY: number): string | null => {
      // 在周/日视图中，data-time-grid-date 在时间列上
      // 在月视图中，不存在 data-time-grid-date，返回 null 让调用方处理
      const timeCol = target.closest('[data-time-grid-date]') as HTMLElement | null;
      if (!timeCol) return null;

      const rect = timeCol.getBoundingClientRect();
      const relY = clientY - rect.top;

      const [startH, startM] = dayBoundaries.start.split(':').map(Number);
      const [endH, endM] = dayBoundaries.end.split(':').map(Number);
      const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
      if (totalMinutes <= 0) return null;

      const colHeight = timeCol.clientHeight;
      if (colHeight <= 0) return null;

      const pixelsPerMinute = colHeight / totalMinutes;
      const offsetMin = Math.round(relY / pixelsPerMinute);
      const clampedMin = Math.max(0, Math.min(offsetMin, totalMinutes));

      const totalMin = startH * 60 + startM + clampedMin;
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    /* ===================== 拖拽事件处理 ===================== */

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const eventEl = target.closest('[data-event-id]') as HTMLElement | null;
      if (!eventEl) return;

      const eventId = eventEl.getAttribute('data-event-id');
      if (!eventId) return;

      const backendEvent = eventMap.current.get(eventId);
      if (!backendEvent) return;

      // 检测是否从 resize 手柄开始拖拽
      const isResize = !!target.closest(
        '.sx__time-grid-event-resize-handle, .sx__date-grid-event-resize-handle',
      );

      dragState.current = {
        eventId,
        backendEvent,
        element: eventEl,
        isTimed: !backendEvent.allDay,
        isResize,
      };

      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', eventId);
      eventEl.classList.add('sx__event--dragging');
    };

    const handleDragEnd = () => {
      if (dragState.current) {
        dragState.current.element.classList.remove('sx__event--dragging');
      }
      dragState.current = null;
      // 清除所有高亮
      wrapper.querySelectorAll('.sx__drop-active').forEach((el) =>
        el.classList.remove('sx__drop-active'),
      );
    };

    const handleDragOver = (e: DragEvent) => {
      if (!dragState.current) return;
      e.preventDefault(); // 允许放置

      // 切换高亮
      const target = e.target as HTMLElement;
      const dropTarget = findDropTarget(target);

      wrapper.querySelectorAll('.sx__drop-active').forEach((el) => {
        if (el !== dropTarget) el.classList.remove('sx__drop-active');
      });

      if (dropTarget && !dropTarget.classList.contains('sx__drop-active')) {
        dropTarget.classList.add('sx__drop-active');
      }
    };

    const handleDrop = (e: DragEvent) => {
      if (!dragState.current) return;
      e.preventDefault();
      e.stopPropagation();

      const ds = dragState.current;
      const target = e.target as HTMLElement;

      if (ds.isResize) {
        /* ---------- 调整时长 ---------- */
        if (ds.isTimed) {
          // 周/日视图 resize：计算新的结束时间，保持开始时间不变
          const timeCol = target.closest('[data-time-grid-date]') as HTMLElement | null;
          if (timeCol) {
            const time = calcTimeFromY(target, e.clientY);
            if (time) {
              const origStartDate = ds.backendEvent.startDate?.split('T')[0];
              if (origStartDate) {
                const endStr = `${origStartDate}T${time}:00.000Z`;
                // 确保结束时间在开始时间之后
                const startTime = ds.backendEvent.startDate || '';
                if (endStr > startTime) {
                  onUpdate(ds.eventId, { endDate: endStr });
                }
              }
            }
          }
        } else {
          // 月视图 resize（全天事件）：拖到目标日期，更新结束日期
          const dropTarget = findDropTarget(target);
          if (dropTarget) {
            const date = getDropDate(dropTarget);
            if (date) {
              onUpdate(ds.eventId, { endDate: date });
            }
          }
        }
        handleDragEnd();
        return;
      }

      /* ---------- 移动日程 ---------- */
      const dropTarget = findDropTarget(target);

      if (!dropTarget) {
        handleDragEnd();
        return;
      }

      const date = getDropDate(dropTarget);
      if (!date) {
        handleDragEnd();
        return;
      }

      // 判断是否为月视图（date-grid-day）
      const isMonthGrid = !!dropTarget.closest('[data-date-grid-date]');
      // 判断是否为时间网格列（周/日视图）
      const isTimeGrid = !!dropTarget.closest(
        '[data-time-grid-date], .sx__week-grid',
      );

      let newData: Partial<CalendarEventData>;

      if (isTimeGrid && !isMonthGrid && ds.isTimed) {
        // 周/日视图：带时间的日程，根据 Y 坐标计算目标时间
        const time = calcTimeFromY(dropTarget, e.clientY);
        if (time) {
          const [h, m] = time.split(':').map(Number);
          const startStr = `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`;

          // 保留原持续时间（最短30分钟）
          const origStart = new Date(ds.backendEvent.startDate ?? '').getTime();
          const origEnd = new Date(ds.backendEvent.endDate ?? ds.backendEvent.startDate ?? '').getTime();
          const durationMs = Math.max(origEnd - origStart || 30 * 60 * 1000, 30 * 60 * 1000);

          const newEnd = new Date(new Date(startStr).getTime() + durationMs);
          const endStr = newEnd.toISOString();

          newData = { startDate: startStr, endDate: endStr, allDay: false };
        } else {
          // 无法计算时间，退化为全天
          newData = { startDate: date, endDate: date, allDay: true };
        }
      } else if (isMonthGrid && ds.isTimed) {
        // 月视图中的定时事件：保留原时间，仅变更日期
        const origStart = ds.backendEvent.startDate;
        const origEnd = ds.backendEvent.endDate;
        const origTimeStr = origStart?.includes('T') ? origStart.split('T')[1] : '00:00:00.000Z';
        const origEndTimeStr = origEnd?.includes('T') ? origEnd.split('T')[1] : undefined;

        newData = {
          startDate: `${date}T${origTimeStr}`,
          allDay: false,
        };
        if (origEndTimeStr && origEnd) {
          newData.endDate = `${date}T${origEndTimeStr}`;
        }
      } else {
        // 全天日程：仅变更日期
        newData = { startDate: date, endDate: date, allDay: true };
      }

      onUpdate(ds.eventId, newData);
      handleDragEnd();
    };

    /* ===================== 监听器注册 ===================== */

    // 初始化使所有事件可拖拽
    enableDraggable();

    // 事件监听（使用捕获阶段确保先于 schedule-x 内部处理）
    wrapper.addEventListener('dragstart', handleDragStart as EventListener);
    wrapper.addEventListener('dragend', handleDragEnd as EventListener);
    wrapper.addEventListener('dragover', handleDragOver as EventListener);
    wrapper.addEventListener('drop', handleDrop as EventListener);

    // MutationObserver: 监听动态添加的事件
    const observer = new MutationObserver(() => {
      enableDraggable();
    });
    observer.observe(wrapper, { childList: true, subtree: true });

    return () => {
      wrapper.removeEventListener('dragstart', handleDragStart as EventListener);
      wrapper.removeEventListener('dragend', handleDragEnd as EventListener);
      wrapper.removeEventListener('dragover', handleDragOver as EventListener);
      wrapper.removeEventListener('drop', handleDrop as EventListener);
      observer.disconnect();
      // 清理高亮
      wrapper.querySelectorAll('.sx__drop-active').forEach((el) =>
        el.classList.remove('sx__drop-active'),
      );
    };
    // dayBoundaries 不会动态变化，忽略 eslint 依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperRef, events, onUpdate]);
}
