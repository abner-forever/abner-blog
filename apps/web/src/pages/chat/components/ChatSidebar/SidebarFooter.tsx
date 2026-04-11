import React, { memo, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useChat } from '../../context/ChatContext';
import './SidebarFooter.less';

const SidebarFooter: React.FC = memo(function SidebarFooter() {
  const { state, dispatch } = useChat();
  const { showKnowledgeBase, showMCPServer, showSkill } = state;

  const handleToggleKnowledgeBase = useCallback(() => {
    dispatch({ type: 'SET_SHOW_KNOWLEDGE_BASE', payload: !showKnowledgeBase });
  }, [dispatch, showKnowledgeBase]);

  const handleToggleMCPServer = useCallback(() => {
    dispatch({ type: 'SET_SHOW_MCP_SERVER', payload: !showMCPServer });
  }, [dispatch, showMCPServer]);

  const handleToggleSkill = useCallback(() => {
    dispatch({ type: 'SET_SHOW_SKILL', payload: !showSkill });
  }, [dispatch, showSkill]);

  return (
    <div className="sidebar-footer">
      <div className="sidebar-footer-divider" />
      <div className="sidebar-footer-buttons">
        <Tooltip title="知识库" placement="right">
          <Button
            type={showKnowledgeBase ? 'primary' : 'text'}
            icon={<DatabaseOutlined />}
            onClick={handleToggleKnowledgeBase}
            className={`sidebar-footer-btn ${showKnowledgeBase ? 'active' : ''}`}
          >
            <span>知识库</span>
          </Button>
        </Tooltip>
        <Tooltip title="MCP 服务器" placement="right">
          <Button
            type={showMCPServer ? 'primary' : 'text'}
            icon={<ApiOutlined />}
            onClick={handleToggleMCPServer}
            className={`sidebar-footer-btn ${showMCPServer ? 'active' : ''}`}
          >
            <span>MCP</span>
          </Button>
        </Tooltip>
        <Tooltip title="技能市场" placement="right">
          <Button
            type={showSkill ? 'primary' : 'text'}
            icon={<RobotOutlined />}
            onClick={handleToggleSkill}
            className={`sidebar-footer-btn ${showSkill ? 'active' : ''}`}
          >
            <span>技能</span>
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});

export default SidebarFooter;
