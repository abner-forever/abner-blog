import type React from 'react';
import type { Message, IntentName, StreamEvent } from '../types';
import {
  formatEventDateTime,
  parseWeatherCardData,
  stripRedactedThinkingBlocks,
} from './stream-utils';

function finishWebSearchLoading<M extends Pick<Message, 'webSearchStatus'>>(
  msg: M,
): M {
  if (msg.webSearchStatus === 'searching') {
    return { ...msg, webSearchStatus: 'done' as const };
  }
  return msg;
}

interface StreamRuntimeState {
  accumulatedText: string;
  accumulatedThinking: string;
  detectedIntent: IntentName | null;
}

interface HandleStreamEventParams {
  streamEvent: StreamEvent;
  assistantMessageId: string;
  runtime: StreamRuntimeState;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  pendingTypeTextRef: React.MutableRefObject<string>;
  streamCompletedRef: React.MutableRefObject<boolean>;
  runTypeWriter: (assistantMessageId: string) => void;
  stopTypeWriter: () => void;
  formatAiStreamErrorPayload: (
    payload: Record<string, unknown> | undefined,
  ) => string;
}

export function handleChatStreamEvent({
  streamEvent,
  assistantMessageId,
  runtime,
  setMessages,
  pendingTypeTextRef,
  streamCompletedRef,
  runTypeWriter,
  stopTypeWriter,
  formatAiStreamErrorPayload,
}: HandleStreamEventParams): void {
  if (streamEvent.event === 'intent') {
    runtime.detectedIntent =
      (streamEvent.payload?.intent as IntentName | undefined) || null;
    if (runtime.detectedIntent === 'web_search') {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, webSearchStatus: 'searching' }
            : msg,
        ),
      );
    }
    return;
  }

  if (streamEvent.event === 'thinking_delta') {
    const delta = (streamEvent.payload?.delta as string) || '';
    if (!delta) return;
    runtime.accumulatedThinking += delta;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? finishWebSearchLoading({
              ...msg,
              thinkingContent: runtime.accumulatedThinking,
              thinkingStatus: 'streaming',
            })
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'chat_delta') {
    if (
      runtime.detectedIntent &&
      runtime.detectedIntent !== 'chat' &&
      runtime.detectedIntent !== 'query_weather' &&
      runtime.detectedIntent !== 'web_search'
    ) {
      return;
    }
    const delta = (streamEvent.payload?.delta as string) || '';
    if (!delta) return;
    runtime.accumulatedText += delta;
    pendingTypeTextRef.current += delta;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? finishWebSearchLoading({
              ...msg,
              content: runtime.accumulatedText,
              isComplete: false,
              answerStatus: 'streaming',
            })
          : msg,
      ),
    );
    runTypeWriter(assistantMessageId);
    return;
  }

  if (streamEvent.event === 'clarification_needed') {
    stopTypeWriter();
    const clarification = streamEvent.payload?.clarification as
      | { suggestion?: string }
      | null
      | undefined;
    const text = clarification?.suggestion || '请补充一些信息';
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? { ...msg, content: text, displayContent: text, isComplete: true }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'todo_created') {
    stopTypeWriter();
    const title =
      (streamEvent.payload?.data as { title?: string } | undefined)?.title || '';
    const text = `✅ 已创建待办事项：${title}`;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: { type: 'todo_created', data: { title } },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'todo_updated') {
    stopTypeWriter();
    const title =
      (streamEvent.payload?.data as { title?: string } | undefined)?.title || '';
    const text = `✏️ 已更新待办事项：${title}`;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: { type: 'todo_updated', data: { title } },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'todo_deleted') {
    stopTypeWriter();
    const title =
      (streamEvent.payload?.data as { title?: string } | undefined)?.title || '';
    const text = `🗑️ 已删除待办事项：${title}`;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: { type: 'todo_deleted', data: { title } },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'event_updated') {
    stopTypeWriter();
    const eventData = (streamEvent.payload?.data || {}) as {
      title?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      allDay?: boolean;
    };
    const title = eventData.title || '未命名日程';
    const timeText = eventData.allDay
      ? `${formatEventDateTime(eventData.startDate)}（全天）`
      : eventData.endDate
        ? `${formatEventDateTime(eventData.startDate)} - ${formatEventDateTime(eventData.endDate)}`
        : formatEventDateTime(eventData.startDate);
    const locationText = eventData.location || '未提供';
    const text = `✏️ 已更新日程：${title}\n\n- 时间：${timeText}\n- 地点：${locationText}`;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: { type: 'event_updated', data: { title, timeText, locationText } },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'event_deleted') {
    stopTypeWriter();
    const eventData = (streamEvent.payload?.data || {}) as {
      title?: string;
      startDate?: string;
    };
    const title = eventData.title || '未命名日程';
    const timeText = formatEventDateTime(eventData.startDate);
    const text = `🗑️ 已取消日程：${title}\n- 原时间：${timeText}`;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: { type: 'event_deleted', data: { title, timeText } },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'event_created') {
    stopTypeWriter();
    const eventData = (streamEvent.payload?.data || {}) as {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      allDay?: boolean;
    };
    const title = eventData.title || '未命名日程';
    const timeText = eventData.allDay
      ? `${formatEventDateTime(eventData.startDate)}（全天）`
      : eventData.endDate
        ? `${formatEventDateTime(eventData.startDate)} - ${formatEventDateTime(eventData.endDate)}`
        : formatEventDateTime(eventData.startDate);
    const locationText = eventData.location || '未提供';
    const detailLines = [
      `📅 已创建日程：${title}`,
      '',
      `- 时间：${timeText}`,
      `- 地点：${locationText}`,
    ];
    if (eventData.description) {
      detailLines.push(`- 描述：${eventData.description}`);
    }
    const text = detailLines.join('\n');
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: {
                type: 'event_created',
                data: {
                  title,
                  timeText,
                  locationText,
                  description: eventData.description,
                },
              },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'schedule_query') {
    stopTypeWriter();
    const scheduleItems =
      (streamEvent.payload?.scheduleData as
        | Array<{
            type: 'event' | 'todo';
            title: string;
            startDate?: string;
            completed?: boolean;
          }>
        | undefined) || [];
    const events = scheduleItems
      .filter((item) => item.type === 'event')
      .map((item) => ({
        title: item.title,
        dateText: item.startDate ? new Date(item.startDate).toLocaleDateString() : undefined,
      }));
    const todos = scheduleItems
      .filter((item) => item.type === 'todo')
      .map((item) => ({
        title: item.title,
        completed: Boolean(item.completed),
      }));
    const analysisData = (streamEvent.payload?.analysis as {
      completionRate?: number;
      total?: number;
      completed?: number;
      pending?: number;
      overdueCount?: number;
      distribution?: string;
      priorityItems?: string[];
      summary?: string;
      suggestion?: string;
    } | undefined);
    const analysis = analysisData
      ? {
          completionRate: analysisData.completionRate ?? 0,
          total: analysisData.total ?? 0,
          completed: analysisData.completed ?? 0,
          pending: analysisData.pending ?? 0,
          overdueCount: analysisData.overdueCount ?? 0,
          distribution: analysisData.distribution ?? '均匀',
          priorityItems: analysisData.priorityItems ?? [],
          summary: analysisData.summary ?? '',
          suggestion: analysisData.suggestion ?? '',
        }
      : undefined;
    const text =
      scheduleItems.length === 0
        ? '📋 您最近没有日程安排。'
        : `📋 您最近的日程和待办：\n${scheduleItems
            .map((item, index) =>
              item.type === 'event'
                ? `${index + 1}. 📅 ${item.title} ${item.startDate ? `(${new Date(item.startDate).toLocaleDateString()})` : ''}`
                : `${index + 1}. ✅ ${item.title} ${item.completed ? '(已完成)' : ''}`,
            )
            .join('\n')}`;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: text,
              displayContent: text,
              isComplete: true,
              card: {
                type: 'schedule_query',
                data: {
                  summary:
                    scheduleItems.length === 0
                      ? '📋 您最近没有日程安排。'
                      : '📋 您最近的日程和待办',
                  events,
                  todos,
                  analysis,
                },
              },
            }
          : msg,
      ),
    );
    return;
  }

  if (streamEvent.event === 'error') {
    throw new Error(
      formatAiStreamErrorPayload(
        streamEvent.payload as Record<string, unknown> | undefined,
      ),
    );
  }

  if (streamEvent.event === 'done') {
    const finalType = streamEvent.payload?.type as string | undefined;
    if (finalType === 'chat' && runtime.accumulatedText) {
      if (runtime.detectedIntent === 'query_weather') {
        const cleanText = stripRedactedThinkingBlocks(
          runtime.accumulatedText,
        );
        const weatherData = parseWeatherCardData(cleanText);
        streamCompletedRef.current = true;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? finishWebSearchLoading({
                  ...msg,
                  content: cleanText,
                  thinkingContent: runtime.accumulatedThinking,
                  thinkingStatus: 'done',
                  answerStatus: 'streaming',
                  isComplete: false,
                  card: weatherData
                    ? { type: 'weather_query', data: weatherData }
                    : undefined,
                })
              : msg,
          ),
        );
        runTypeWriter(assistantMessageId);
      } else {
        streamCompletedRef.current = true;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? finishWebSearchLoading({
                  ...msg,
                  content: runtime.accumulatedText,
                  thinkingContent: runtime.accumulatedThinking,
                  thinkingStatus: 'done',
                  answerStatus: 'streaming',
                })
              : msg,
          ),
        );
        runTypeWriter(assistantMessageId);
      }
    } else if (finalType === 'chat') {
      streamCompletedRef.current = false;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? finishWebSearchLoading({
                ...msg,
                isComplete: true,
                thinkingStatus: 'done',
                answerStatus: 'done',
              })
            : msg,
        ),
      );
    } else {
      streamCompletedRef.current = true;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? finishWebSearchLoading({
                ...msg,
                thinkingStatus: 'done',
                answerStatus:
                  msg.answerStatus === 'streaming' ? 'streaming' : 'done',
              })
            : msg,
        ),
      );
    }
  }
}
