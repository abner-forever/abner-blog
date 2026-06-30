import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import MCPServerPanel from '../components/MCPServerPanel';

const MCPSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="settings-fullscreen-page">
      <div className="settings-page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleClose}
          className="settings-page-back"
        />
        <span className="settings-page-title">MCP</span>
      </div>
      <div className="settings-page-content">
        <MCPServerPanel onClose={handleClose} />
      </div>
    </div>
  );
};

export default MCPSettingsPage;
