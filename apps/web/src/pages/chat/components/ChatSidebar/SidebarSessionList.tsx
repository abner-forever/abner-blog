import React, { memo, useMemo } from 'react';
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

const SidebarSessionList: React.FC<Props> = memo(function SidebarSessionList({ onDeleteSession }) {
  const { state, switchSession } = useChat();
  const { sessions, currentSessionId } = state;

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

    // Sort sessions within each group by timestamp descending
    groups.forEach((g) => {
      g.sessions.sort((a, b) => b.timestamp - a.timestamp);
    });

    return groups.filter((g) => g.sessions.length > 0);
  }, [sessions]);

  return (
    <div className="sidebar-session-list">
      {groupedSessions.map((group) => (
        <div key={group.label} className="session-group">
          <div className="session-group-label">{group.label}</div>
          {group.sessions.map((session) => (
            <div
              key={session.id}
              className={`sidebar-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => switchSession(session.id)}
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
                onClick={(e) => onDeleteSession(e, session.id)}
              />
            </div>
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
