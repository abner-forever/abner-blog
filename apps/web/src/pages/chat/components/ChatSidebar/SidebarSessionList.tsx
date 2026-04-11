import React, { memo, useMemo, useCallback } from 'react';
import { Button } from 'antd';
import { MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { useChat } from '../../context/ChatContext';
import type { ChatSession } from '../../types';
import dayjs from 'dayjs';

interface Props {
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}

interface SessionGroup {
  label: string;
  sessions: ChatSession[];
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSwitch: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

const SessionItem = memo(function SessionItem({ session, isActive, onSwitch, onDelete }: SessionItemProps) {
  const handleClick = useCallback(() => onSwitch(session.id), [onSwitch, session.id]);
  const handleDelete = useCallback((e: React.MouseEvent) => onDelete(e, session.id), [onDelete, session.id]);

  return (
    <div
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <MessageOutlined />
      <div className="sidebar-item-content">
        <div className="sidebar-item-title">{session.title}</div>
        <div className="sidebar-item-date">
          {dayjs(session.timestamp).format('HH:mm')}
        </div>
      </div>
      <Button
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        className="sidebar-item-delete"
        onClick={handleDelete}
      />
    </div>
  );
});

const SidebarSessionList: React.FC<Props> = memo(function SidebarSessionList({ onDeleteSession }) {
  const { state, switchSession } = useChat();
  const { sessions, currentSessionId } = state;

  // 使用 session IDs 字符串作为依赖，而不是整个 sessions 数组
  // 这样只有当 session 增删时才会重新计算分组，避免流式更新时频繁重算
  const sessionIds = useMemo(() => sessions.map(s => s.id).join(','), [sessions]);

  const groupedSessions = useMemo(() => {
    const now = dayjs();
    const today = now.startOf('day');
    const yesterday = today.subtract(1, 'day');
    const weekAgo = today.subtract(7, 'day');

    const groups: SessionGroup[] = [
      { label: '今天', sessions: [] },
      { label: '昨天', sessions: [] },
      { label: '过去7天', sessions: [] },
      { label: '更早', sessions: [] },
    ];

    sessions.forEach((session) => {
      const sessionDate = dayjs(session.timestamp);
      if (sessionDate.isAfter(today)) {
        groups[0].sessions.push(session);
      } else if (sessionDate.isAfter(yesterday)) {
        groups[1].sessions.push(session);
      } else if (sessionDate.isAfter(weekAgo)) {
        groups[2].sessions.push(session);
      } else {
        groups[3].sessions.push(session);
      }
    });

    groups.forEach((g) => {
      g.sessions.sort((a, b) => b.timestamp - a.timestamp);
    });

    return groups.filter((g) => g.sessions.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIds]);

  const handleSwitch = useCallback((id: string) => switchSession(id), [switchSession]);
  const handleDelete = useCallback((e: React.MouseEvent, id: string) => onDeleteSession(e, id), [onDeleteSession]);

  return (
    <div className="sidebar-session-list">
      {groupedSessions.map((group) => (
        <div key={group.label} className="session-group">
          <div className="session-group-label">{group.label}</div>
          {group.sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={currentSessionId === session.id}
              onSwitch={handleSwitch}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="sidebar-empty">暂无历史记录</div>
      )}
    </div>
  );
});

export default SidebarSessionList;
