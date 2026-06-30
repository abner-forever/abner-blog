import React, { memo } from 'react';
import { Button, Drawer, Tooltip } from 'antd';
import {
  DeleteOutlined,
  DatabaseOutlined,
  ApiOutlined,
  RobotOutlined,
  LoginOutlined,
  MessageOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useChat } from '../context/ChatContext';
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
  const { state: chatState, dispatch } = useChat();
  const { showKnowledgeBase, showMCPServer, showSkill } = chatState;

  return (
    <Drawer
      title={null}
      placement="left"
      closable={false}
      open={open}
      width={300}
      onClose={onClose}
      className="chat-history-drawer"
    >
      {isAuthenticated ? (
        <>
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
          {/* Mobile sidebar footer toggles — knowledge base, MCP, skills */}
          <div className="drawer-footer">
            <Tooltip title="知识库" placement="right">
              <Button
                type={showKnowledgeBase ? 'primary' : 'text'}
                icon={<DatabaseOutlined />}
                onClick={() => {
                  if (!checkAuth()) return;
                  onClose();
                  dispatch({ type: 'SET_SHOW_KNOWLEDGE_BASE', payload: !showKnowledgeBase });
                }}
                className={`drawer-footer-btn ${showKnowledgeBase ? 'active' : ''}`}
              >
                <span>知识库</span>
              </Button>
            </Tooltip>
            <Tooltip title="MCP 服务器" placement="right">
              <Button
                type={showMCPServer ? 'primary' : 'text'}
                icon={<ApiOutlined />}
                onClick={() => {
                  if (!checkAuth()) return;
                  onClose();
                  dispatch({ type: 'SET_SHOW_MCP_SERVER', payload: !showMCPServer });
                }}
                className={`drawer-footer-btn ${showMCPServer ? 'active' : ''}`}
              >
                <span>MCP</span>
              </Button>
            </Tooltip>
            <Tooltip title="技能市场" placement="right">
              <Button
                type={showSkill ? 'primary' : 'text'}
                icon={<RobotOutlined />}
                onClick={() => {
                  if (!checkAuth()) return;
                  onClose();
                  dispatch({ type: 'SET_SHOW_SKILL', payload: !showSkill });
                }}
                className={`drawer-footer-btn ${showSkill ? 'active' : ''}`}
              >
                <span>技能</span>
              </Button>
            </Tooltip>
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
