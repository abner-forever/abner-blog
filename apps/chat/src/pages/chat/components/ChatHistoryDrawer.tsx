import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Drawer } from 'antd';
import {
  DeleteOutlined,
  LoginOutlined,
  MessageOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/reduxHooks';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import CustomEmpty from '@/components/CustomEmpty';
import type { ChatSession } from '../types';

interface Props {
  open: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}

const ChatHistoryDrawer: React.FC<Props> = memo(function ChatHistoryDrawer({
  open,
  sessions,
  currentSessionId,
  isAuthenticated,
  onClose,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
}) {
  const { t } = useTranslation();
  const { checkAuth } = useAuthCheck();
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  return (
    <Drawer
      title={null}
      placement="left"
      closable={false}
      open={open}
      size={300}
      onClose={onClose}
      className="chat-history-drawer"
    >
      {isAuthenticated ? (
        <>
          <div className="drawer-header">
            <span className="drawer-title">{t('chat.chatHistory', { defaultValue: '聊天历史' })}</span>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={onCreateSession}
              className="new-chat-btn"
            >
              {t('common.newChat')}
            </Button>
          </div>
          <div className="drawer-list">
            {sessions.length === 0 ? (
              <CustomEmpty tip={t('chat.noHistory', { defaultValue: '暂无历史记录' })} />
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
          {/* Mobile drawer footer — user info + settings entry */}
          <div
            className="drawer-footer"
            onClick={() => {
              if (!checkAuth()) return;
              onClose();
              navigate('/chat/settings');
            }}
          >
            <div className="drawer-user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="drawer-user-avatar-img" loading="lazy" />
              ) : (
                <div className="drawer-user-avatar-placeholder">
                  {(user?.nickname || user?.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="drawer-user-info">
              <span className="drawer-user-name">{user?.nickname || user?.username || 'User'}</span>
            </div>
            <RightOutlined className="drawer-user-arrow" />
          </div>
        </>
      ) : (
        <div className="drawer-guest-prompt">
          <LoginOutlined className="drawer-guest-prompt__icon" />
          <p className="drawer-guest-prompt__text">{t('chat.loginToViewHistory', { defaultValue: '登录后查看聊天记录' })}</p>
          <Button type="primary" icon={<LoginOutlined />} onClick={() => checkAuth()}>
            {t('nav.login')}
          </Button>
        </div>
      )}
    </Drawer>
  );
});

export default ChatHistoryDrawer;
