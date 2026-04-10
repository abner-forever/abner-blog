import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  List,
  Tag,
  Switch,
  message,
  Popconfirm,
  Empty,
  Spin,
} from 'antd';
import {
  ApiOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  mcpServersService,
  type MCPServerResponse,
  type MarketplaceMCPServer,
} from '@services/mcp-servers';
import './MCPServerPanel.less';

interface Props {
  onClose: () => void;
}

const MCPServerPanel: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [installedServers, setInstalledServers] = useState<MCPServerResponse[]>([]);
  const [marketplaceServers, setMarketplaceServers] = useState<MarketplaceMCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installed, marketplace] = await Promise.all([
        mcpServersService.getAll(),
        mcpServersService.getMarketplace(),
      ]);
      setInstalledServers(installed);
      setMarketplaceServers(marketplace);
    } catch (err) {
      message.error(t('chat.loadFailed') || '加载MCP服务器失败');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInstall = async (marketplaceServer: MarketplaceMCPServer) => {
    try {
      await mcpServersService.install({
        marketplaceId: marketplaceServer.id,
        name: marketplaceServer.name,
        allowedTools: marketplaceServer.tools,
      });
      message.success(t('chat.installSuccess') || `${marketplaceServer.name} 安装成功`);
      loadData();
    } catch (err) {
      message.error(t('chat.installFailed') || '安装失败');
    }
  };

  const handleUninstall = async (id: string) => {
    try {
      await mcpServersService.uninstall(id);
      message.success(t('chat.uninstallSuccess') || '卸载成功');
      loadData();
    } catch (err) {
      message.error(t('chat.uninstallFailed') || '卸载失败');
    }
  };

  const handleToggleStatus = async (server: MCPServerResponse) => {
    try {
      const newStatus = server.status === 'active' ? 'inactive' : 'active';
      await mcpServersService.update(server.id, { status: newStatus });
      message.success(newStatus === 'active' ? t('chat.enabled') || '已启用' : t('chat.disabled') || '已停用');
      loadData();
    } catch (err) {
      message.error(t('chat.updateFailed') || '更新失败');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
    }
  };

  return (
    <div className="mcp-server-panel">
      <div className="panel-header">
        <div className="panel-title">
          <ApiOutlined />
          <span>{t('chat.mcpServers')}</span>
        </div>
        <Button type="text" size="small" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>

      <div className="panel-tabs">
        <div
          className={`tab-item ${activeTab === 'installed' ? 'active' : ''}`}
          onClick={() => setActiveTab('installed')}
        >
          {t('chat.installedServers')}
          <Tag className="tab-count">{installedServers.length}</Tag>
        </div>
        <div
          className={`tab-item ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          {t('chat.marketplace')}
        </div>
      </div>

      <div className="panel-content">
        {loading ? (
          <Spin />
        ) : activeTab === 'installed' ? (
          installedServers.length === 0 ? (
            <Empty description={t('chat.noServers')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              className="server-list"
              dataSource={installedServers}
              renderItem={(server) => (
                <List.Item
                  className="server-item"
                  actions={[
                    <Switch
                      key="toggle"
                      size="small"
                      checked={server.status === 'active'}
                      onChange={() => handleToggleStatus(server)}
                    />,
                    <Popconfirm
                      key="uninstall"
                      title={t('chat.uninstallConfirm')}
                      onConfirm={() => handleUninstall(server.id)}
                      okText={t('common.ok')}
                      cancelText={t('common.cancel')}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        {t('chat.uninstall')}
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="server-icon">
                        {server.icon || <ApiOutlined />}
                      </div>
                    }
                    title={
                      <div className="server-title">
                        {server.name}
                        {getStatusIcon(server.status)}
                      </div>
                    }
                    description={
                      <div className="server-info">
                        <span className="server-tools">
                          {server.allowedTools?.length || 0} tools
                        </span>
                        {server.lastError && (
                          <span className="server-error" title={server.lastError}>
                            {server.lastError.substring(0, 30)}...
                          </span>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )
        ) : (
          <List
            className="server-list"
            dataSource={marketplaceServers}
            renderItem={(server) => (
              <List.Item
                className="server-item"
                actions={[
                  server.isInstalled ? (
                    <Tag key="installed" color="success">
                      {t('chat.installed')}
                    </Tag>
                  ) : (
                    <Button
                      key="install"
                      size="small"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => handleInstall(server)}
                    >
                      {t('chat.install')}
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="server-icon">
                      {server.icon || <ApiOutlined />}
                    </div>
                  }
                  title={server.name}
                  description={
                    <div className="server-description">
                      <span>{server.description}</span>
                      <div className="server-tools-list">
                        {server.tools.slice(0, 3).map((tool) => (
                          <Tag key={tool} className="tool-tag">
                            {tool}
                          </Tag>
                        ))}
                        {server.tools.length > 3 && (
                          <Tag className="tool-tag">+{server.tools.length - 3}</Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default MCPServerPanel;
