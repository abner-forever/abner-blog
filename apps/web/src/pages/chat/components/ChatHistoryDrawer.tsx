import React, { memo } from 'react';
import { Button, Drawer } from 'antd';
import { DeleteOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons';
import CustomEmpty from '@/components/CustomEmpty';
import type { ChatSession } from '../types';

interface Props {
  open: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onClose: () => void;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}

const ChatHistoryDrawer: React.FC<Props> = memo(function ChatHistoryDrawer({
  open,
  sessions,
  currentSessionId,
  onClose,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
}) {
  return (
    <Drawer
      title={null}
      placement="left"
      closable={false}
      open={open}
      size="60%"
      onClose={onClose}
      className="chat-history-drawer"
    >
      <div className="drawer-header">
        <span className="drawer-title">聊天历史</span>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onCreateSession}
          className="new-chat-btn"
        >
          新建对话
        </Button>
      </div>
      <div className="drawer-list">
        {sessions.length === 0 ? (
          <CustomEmpty tip="暂无历史记录" />
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`drawer-item ${currentSessionId === session.id ? 'active' : ''}`}
              onClick={() => onSwitchSession(session.id)}
            >
              <MessageOutlined className="item-icon" />
              <div className="item-content">
                <div className="item-title">{session.title}</div>
              </div>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                className="item-delete"
                onClick={(e) => onDeleteSession(e, session.id)}
              />
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
});

export default ChatHistoryDrawer;
