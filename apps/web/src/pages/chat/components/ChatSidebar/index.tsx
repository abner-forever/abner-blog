import React, { memo, useCallback } from 'react';
import { Button } from 'antd';
import { PlusOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useChat } from '../../context/ChatContext';
import SidebarSearch from './SidebarSearch';
import SidebarSessionList from './SidebarSessionList';
import SidebarFooter from './SidebarFooter';
import FooterUserSection from './FooterUserSection';
import { isMobile } from '@/utils/device';
import './ChatSidebar.less';

const ChatSidebar: React.FC = memo(function ChatSidebar() {
  const { state, dispatch, createNewSession, switchSession, deleteSession } = useChat();
  const { sidebarCollapsed } = state;

  const handleToggleCollapsed = useCallback(() => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !sidebarCollapsed });
  }, [dispatch, sidebarCollapsed]);

  const handleMobileDrawerClose = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_DRAWER_OPEN', payload: false });
  }, [dispatch]);

  const handleSearchResultClick = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      handleMobileDrawerClose();
    },
    [switchSession, handleMobileDrawerClose]
  );

  const handleDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string) => {
      e.stopPropagation();
      deleteSession(sessionId);
    },
    [deleteSession]
  );

  if (isMobile()) {
    return (
      <div className={`chat-sidebar mobile-drawer ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewSession}
            block
            className="new-chat-btn"
          >
            新建对话
          </Button>
        </div>
        <SidebarSearch onResultClick={handleSearchResultClick} />
        <SidebarSessionList onDeleteSession={handleDeleteSession} />
        <SidebarFooter />
        <FooterUserSection />
      </div>
    );
  }

  return (
    <div className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle button */}
      <div className="sidebar-toggle">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleCollapsed}
          className="toggle-btn"
        />
      </div>

      {/* Full sidebar content */}
      {!sidebarCollapsed && (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={createNewSession}
              block
              className="new-chat-btn"
            >
              新建对话
            </Button>
          </div>
          <SidebarSearch onResultClick={handleSearchResultClick} />
          <SidebarSessionList onDeleteSession={handleDeleteSession} />
          <SidebarFooter />
        </div>
      )}

      {/* User section - always at bottom */}
      <FooterUserSection />
    </div>
  );
});

export default ChatSidebar;
