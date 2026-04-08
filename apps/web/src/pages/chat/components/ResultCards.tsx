import { memo } from 'react';

export type AssistantCard =
  | {
      type: 'todo_created' | 'todo_updated' | 'todo_deleted';
      data: {
        title: string;
      };
    }
  | {
      type: 'event_created';
      data: {
        title: string;
        timeText: string;
        locationText: string;
        description?: string;
      };
    }
  | {
      type: 'event_updated' | 'event_deleted';
      data: {
        title: string;
        timeText: string;
        locationText?: string;
      };
    }
  | {
      type: 'schedule_query';
      data: {
        summary: string;
        events?: Array<{ title: string; dateText?: string }>;
        todos?: Array<{ title: string; completed: boolean }>;
        items?: string[];
        analysis?: {
          completionRate: number;
          total: number;
          completed: number;
          pending: number;
          overdueCount: number;
          distribution: string;
          priorityItems: string[];
          summary: string;
          suggestion: string;
        };
      };
    }
  | {
      type: 'weather_query';
      data: {
        city: string;
        dateLabel: string;
        temperatureText: string;
        maxTemperatureText: string;
        minTemperatureText: string;
        windspeedText: string;
        weatherText?: string;
        clothingAdvice?: string;
        airQualityText?: string;
        coldIndexText?: string;
      };
    };

type WeatherQueryData = Extract<AssistantCard, { type: 'weather_query' }>['data'];

const TodoCard = memo<{ header: string; modifier: string; title: string }>(
  ({ header, modifier, title }) => (
    <div className={`ai-result-card ${modifier}`}>
      <div className="ai-result-card__header">{header}</div>
      <div className="ai-result-card__title">{title || '未命名待办'}</div>
    </div>
  ),
);

const EventCard = memo<{
  header: string;
  modifier: string;
  title: string;
  timeText: string;
  locationText?: string;
  description?: string;
}>(({ header, modifier, title, timeText, locationText, description }) => (
  <div className={`ai-result-card ${modifier}`}>
    <div className="ai-result-card__header">{header}</div>
    <div className="ai-result-card__title">{title || '未命名日程'}</div>
    <div className="ai-result-card__meta">
      {modifier === 'ai-result-card--event-deleted' ? '原时间' : '时间'}：{timeText}
    </div>
    {locationText ? <div className="ai-result-card__meta">地点：{locationText}</div> : null}
    {description ? <div className="ai-result-card__desc">描述：{description}</div> : null}
  </div>
));

const ScheduleQueryCard = memo<{
  summary: string;
  events?: Array<{ title: string; dateText?: string }>;
  todos?: Array<{ title: string; completed: boolean }>;
  items?: string[];
  analysis?: {
    completionRate: number;
    total: number;
    completed: number;
    pending: number;
    overdueCount: number;
    distribution: string;
    priorityItems: string[];
    summary: string;
    suggestion: string;
  };
}>(({ summary, events, todos, items, analysis }) => {
  const safeEvents = events || [];
  const safeTodos = todos || [];
  const safeItems = items || [];

  return (
    <div className="ai-result-card ai-result-card--schedule-query">
      <div className="ai-result-card__header">📋 日程查询结果</div>
      <div className="ai-result-card__title">{summary}</div>

      {analysis ? (
        <div className="ai-schedule-analysis">
          <div className="ai-schedule-analysis__progress">
            <div className="ai-schedule-analysis__progress-bar">
              <div
                className="ai-schedule-analysis__progress-fill"
                style={{ width: `${analysis.completionRate}%` }}
              />
            </div>
            <span className="ai-schedule-analysis__rate">
              {analysis.completionRate}% 完成
            </span>
          </div>

          <div className="ai-schedule-analysis__stats">
            <span>共 {analysis.total} 项</span>
            <span>✅ 已完成 {analysis.completed}</span>
            <span>⬜ 待处理 {analysis.pending}</span>
            {analysis.overdueCount > 0 && (
              <span className="is-overdue">⚠️ 过期 {analysis.overdueCount}</span>
            )}
          </div>

          {analysis.priorityItems.length > 0 && (
            <div className="ai-schedule-analysis__priority">
              <span className="ai-schedule-analysis__priority-label">🔥 优先处理：</span>
              {analysis.priorityItems.join('、')}
            </div>
          )}

          {analysis.suggestion && (
            <div className="ai-schedule-analysis__suggestion">
              💡 {analysis.suggestion}
            </div>
          )}
        </div>
      ) : null}

      {safeEvents.length > 0 ? (
        <div className="ai-schedule-section">
          <div className="ai-schedule-section__title">📅 最近日程</div>
          <div className="ai-schedule-event-list">
            {safeEvents.map((event, index) => (
              <div
                key={`event-${event.title}-${index}`}
                className="ai-schedule-event-item"
              >
                <div className="ai-schedule-event-item__name">{event.title}</div>
                {event.dateText ? (
                  <div className="ai-schedule-event-item__date">{event.dateText}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {safeTodos.length > 0 ? (
        <div className="ai-schedule-section">
          <div className="ai-schedule-section__title">✅ 最近待办</div>
          <div className="ai-schedule-todo-list">
            {safeTodos.map((todo, index) => (
              <div
                key={`todo-${todo.title}-${index}`}
                className={`ai-schedule-todo-item ${todo.completed ? 'is-completed' : ''}`}
              >
                <span className="ai-schedule-todo-item__icon">
                  {todo.completed ? '☑️' : '⬜'}
                </span>
                <span className="ai-schedule-todo-item__text">{todo.title}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {safeEvents.length === 0 && safeTodos.length === 0 && safeItems.length > 0 ? (
        <div className="ai-schedule-section">
          {safeItems.map((item, index) => (
            <div key={`legacy-item-${index}`} className="ai-result-card__meta">
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

const formatWindDisplay = (raw: string): string => {
  const t = raw.trim();
  if (!t) return raw;
  if (/km\/?h/i.test(t)) return t;
  return `${t} km/h`;
};

const WeatherCard = memo<{ data: WeatherQueryData }>(({ data }) => {
  const {
    city,
    dateLabel,
    temperatureText,
    maxTemperatureText,
    minTemperatureText,
    windspeedText,
    weatherText,
    clothingAdvice,
    airQualityText,
    coldIndexText,
  } = data;
  const weatherValue = weatherText || '未知';
  const weatherVisual = getWeatherVisual(weatherValue);
  const windDisplay = formatWindDisplay(windspeedText);

  const insights: Array<{
    key: 'clothing' | 'aqi' | 'cold';
    label: string;
    glyph: string;
    text: string;
  }> = [];
  if (clothingAdvice) {
    insights.push({ key: 'clothing', label: '穿衣建议', glyph: '👔', text: clothingAdvice });
  }
  if (airQualityText) {
    insights.push({ key: 'aqi', label: '空气质量', glyph: '🌿', text: airQualityText });
  }
  if (coldIndexText) {
    insights.push({ key: 'cold', label: '感冒指数', glyph: '🧣', text: coldIndexText });
  }

  return (
    <div className="ai-result-card ai-result-card--weather-query">
      <header className="ai-weather-head">
        <span className="ai-weather-head__badge">🌤️ 天气查询结果</span>
        <div className="ai-weather-head__place">
          <span className="ai-weather-head__city">{city}</span>
          <span className="ai-weather-head__date">{dateLabel}</span>
        </div>
      </header>

      <div className="ai-weather-hero">
        <div className="ai-weather-hero__icon-wrap">
          <i
            className={`ai-weather-hero__icon ${weatherVisual.className} ${weatherVisual.iconClass}`}
            aria-hidden="true"
          />
        </div>
        <div className="ai-weather-hero__body">
          <div className="ai-weather-hero__temp">{temperatureText}</div>
          <div className="ai-weather-hero__status">{weatherValue}</div>
        </div>
      </div>

      <div className="ai-weather-metrics">
        <div className="ai-weather-metric">
          <div className="ai-weather-metric__label">最高</div>
          <div className="ai-weather-metric__value">{maxTemperatureText}</div>
        </div>
        <div className="ai-weather-metric">
          <div className="ai-weather-metric__label">最低</div>
          <div className="ai-weather-metric__value">{minTemperatureText}</div>
        </div>
        <div className="ai-weather-metric">
          <div className="ai-weather-metric__label">风速</div>
          <div className="ai-weather-metric__value">{windDisplay}</div>
        </div>
      </div>

      {insights.length > 0 ? (
        <div className="ai-weather-insights">
          {insights.map((item) => (
            <div
              key={item.key}
              className={`ai-weather-insight ai-weather-insight--${item.key}`}
            >
              <div className="ai-weather-insight__head">
                <span className="ai-weather-insight__glyph" aria-hidden="true">
                  {item.glyph}
                </span>
                <span className="ai-weather-insight__label">{item.label}</span>
              </div>
              <p className="ai-weather-insight__text">{item.text}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
});

const getWeatherVisual = (
  weatherText: string,
): { iconClass: string; className: string } => {
  if (/雷/.test(weatherText)) return { iconClass: 'qi-302-fill', className: 'is-thunder' };
  if (/雪|冰/.test(weatherText)) return { iconClass: 'qi-400-fill', className: 'is-snow' };
  if (/雨|阵雨/.test(weatherText)) return { iconClass: 'qi-300-fill', className: 'is-rain' };
  if (/雾|霾/.test(weatherText)) return { iconClass: 'qi-500-fill', className: 'is-fog' };
  if (/晴/.test(weatherText)) return { iconClass: 'qi-100-fill', className: 'is-sunny' };
  if (/云|阴/.test(weatherText)) return { iconClass: 'qi-101-fill', className: 'is-cloudy' };
  return { iconClass: 'qi-999-fill', className: 'is-default' };
};

const AssistantCardRenderer = memo<{ card: AssistantCard }>(({ card }) => {
  switch (card.type) {
    case 'todo_created':
      return (
        <TodoCard
          header="✅ 待办已创建"
          modifier="ai-result-card--todo-created"
          title={card.data.title}
        />
      );
    case 'todo_updated':
      return (
        <TodoCard
          header="✏️ 待办已更新"
          modifier="ai-result-card--todo-updated"
          title={card.data.title}
        />
      );
    case 'todo_deleted':
      return (
        <TodoCard
          header="🗑️ 待办已删除"
          modifier="ai-result-card--todo-deleted"
          title={card.data.title}
        />
      );
    case 'event_created':
      return (
        <EventCard
          header="📅 日程已创建"
          modifier="ai-result-card--event-created"
          title={card.data.title}
          timeText={card.data.timeText}
          locationText={card.data.locationText}
          description={card.data.description}
        />
      );
    case 'event_updated':
      return (
        <EventCard
          header="✏️ 日程已更新"
          modifier="ai-result-card--event-updated"
          title={card.data.title}
          timeText={card.data.timeText}
          locationText={card.data.locationText || '未提供'}
        />
      );
    case 'event_deleted':
      return (
        <EventCard
          header="🗑️ 日程已删除"
          modifier="ai-result-card--event-deleted"
          title={card.data.title}
          timeText={card.data.timeText}
        />
      );
    case 'schedule_query':
      return (
        <ScheduleQueryCard
          summary={card.data.summary}
          events={card.data.events}
          todos={card.data.todos}
          items={card.data.items}
          analysis={card.data.analysis}
        />
      );
    case 'weather_query':
      return <WeatherCard data={card.data} />;
    default:
      return null;
  }
});

AssistantCardRenderer.displayName = 'AssistantCardRenderer';

export default AssistantCardRenderer;
