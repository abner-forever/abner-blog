import React, { memo } from 'react';
import { Button } from 'antd';
import {
  DeleteOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import CustomEmpty from '@/components/CustomEmpty';
import type { ChatSession } from '../types';

interface Props {
  sidebarCollapsed: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onToggleCollapsed: () => void;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}

const ChatSidebar: React.FC<Props> = memo(function ChatSidebar({
  sidebarCollapsed,
  sessions,
  currentSessionId,
  onToggleCollapsed,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
}) {
  return (
    <div className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapsed}
        />
      </div>
      {!sidebarCollapsed && (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreateSession} block>
              新建对话
            </Button>
          </div>
          <div className="sidebar-list">
            {sessions.length === 0 ? (
              <CustomEmpty tip="暂无历史记录" />
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`sidebar-item ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => onSwitchSession(session.id)}
                >
                  <MessageOutlined />
                  <div className="sidebar-item-content">
                    <div className="sidebar-item-title">{session.title}</div>
                  </div>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    className="sidebar-item-delete"
                    onClick={(e) => onDeleteSession(e, session.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatSidebar;
