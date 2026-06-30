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
  Modal,
  Input,
  Form,
  Alert,
  Tooltip,
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

type MCPConfigFormValues = {
  url?: string;
  bearerToken?: string;
  timeoutMs?: number;
  headersJson?: string;
};

const MCPServerPanel: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const [installedServers, setInstalledServers] = useState<MCPServerResponse[]>([]);
  const [marketplaceServers, setMarketplaceServers] = useState<MarketplaceMCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncingTools, setSyncingTools] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnoseText, setDiagnoseText] = useState('');
  const [diagnoseResult, setDiagnoseResult] = useState<{
    success: boolean;
    message: string;
    sampleTool?: string;
    steps: Array<{ step: string; ok: boolean; detail: string }>;
  } | null>(null);
  const [editingServer, setEditingServer] = useState<MCPServerResponse | null>(null);
  const [configForm] = Form.useForm<MCPConfigFormValues>();

  const builtinServers = marketplaceServers.filter((server) => server.source === 'builtin');
  const marketplaceOnlyServers = marketplaceServers.filter(
    (server) => server.source === 'marketplace'
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [installed, marketplace] = await Promise.all([
        mcpServersService.getAll(),
        mcpServersService.getCatalog(),
      ]);
      setInstalledServers(installed);
      setMarketplaceServers(marketplace);
    } catch {
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
      message.success(t('chat.installSuccess', { name: marketplaceServer.name }) || `${marketplaceServer.name} 安装成功`);
      loadData();
    } catch {
      message.error(t('chat.installFailed') || '安装失败');
    }
  };

  const handleUninstall = async (id: string) => {
    try {
      await mcpServersService.uninstall(id);
      message.success(t('chat.uninstallSuccess') || '卸载成功');
      loadData();
    } catch {
      message.error(t('chat.uninstallFailed') || '卸载失败');
    }
  };

  const handleToggleStatus = async (server: MCPServerResponse) => {
    try {
      const newStatus = server.status === 'active' ? 'inactive' : 'active';
      await mcpServersService.update(server.id, { status: newStatus });
      message.success(newStatus === 'active' ? t('chat.enabled') || '已启用' : t('chat.disabled') || '已停用');
      loadData();
    } catch {
      message.error(t('chat.updateFailed') || '更新失败');
    }
  };

  const handleOpenConfig = (server: MCPServerResponse) => {
    setEditingServer(server);
    setDiagnoseText('');
    setDiagnoseResult(null);
    const cfg = server.config || {};
    configForm.setFieldsValue({
      url: typeof cfg.url === 'string' ? cfg.url : '',
      bearerToken: typeof cfg.bearerToken === 'string' ? cfg.bearerToken : '',
      timeoutMs: typeof cfg.timeoutMs === 'number' ? cfg.timeoutMs : 12000,
      headersJson:
        cfg.headers && typeof cfg.headers === 'object'
          ? JSON.stringify(cfg.headers, null, 2)
          : '',
    });
    setConfigModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!editingServer) return;
    try {
      const values = await configForm.validateFields();
      const config = buildRemoteConfigPayload(values);
      setConfigSaving(true);
      await mcpServersService.update(editingServer.id, {
        config,
      });
      message.success(t('chat.updateSuccess') || '更新成功');
      setConfigModalOpen(false);
      setEditingServer(null);
      setDiagnoseText('');
      setDiagnoseResult(null);
      loadData();
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message);
      } else {
        message.error(t('chat.updateFailed') || '更新失败');
      }
    } finally {
      setConfigSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!editingServer) return;
    setTestingConnection(true);
    try {
      const config = buildRemoteConfigPayload(
        configForm.getFieldsValue() as MCPConfigFormValues,
      );
      const result = await mcpServersService.testConnection(editingServer.id, config);
      if (result.success) {
        message.success(result.message || t('chat.testConnectionPass', { defaultValue: 'Connection test passed' }));
      } else {
        message.warning(result.message || t('chat.testConnectionFail', { defaultValue: 'Connection test failed' }));
      }
    } catch (error) {
      message.error((error as Error).message || t('chat.testConnectionFail', { defaultValue: 'Connection test failed' }));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncTools = async () => {
    if (!editingServer) return;
    setSyncingTools(true);
    try {
      const result = await mcpServersService.syncTools(editingServer.id);
      if (result.success) {
        message.success(result.message || t('chat.syncToolsSuccess', { defaultValue: 'Tools synced successfully' }));
        loadData();
      } else {
        message.warning(result.message || t('chat.syncToolsFail', { defaultValue: 'Tools sync failed' }));
      }
    } catch (error) {
      message.error((error as Error).message || t('chat.syncToolsFail', { defaultValue: 'Tools sync failed' }));
    } finally {
      setSyncingTools(false);
    }
  };

  const handleDiagnoseConnection = async () => {
    if (!editingServer) return;
    setDiagnosing(true);
    try {
      const config = buildRemoteConfigPayload(
        configForm.getFieldsValue() as MCPConfigFormValues,
      );
      const result = await mcpServersService.diagnoseConnection(
        editingServer.id,
        config,
      );
      const lines = [
        `${t('chat.diagnoseOverallPass', { defaultValue: 'Overall: PASS' })} / ${t('chat.diagnoseOverallFail', { defaultValue: 'Overall: FAIL' })}`.replace(/ \/ .*/, result.success ? '' : ''),
        `${t('chat.diagnoseSummary', { defaultValue: 'Summary' })}: ${result.message}`,
        ...(result.sampleTool ? [`${t('chat.diagnoseSampleTool', { defaultValue: 'Sample Tool' })}: ${result.sampleTool}`] : []),
        '',
        `${t('chat.diagnoseStepsDetail', { defaultValue: 'Step Details' })}:`,
        ...result.steps.map(
          (
            s: { step: string; ok: boolean; detail: string },
            idx: number,
          ) => `${idx + 1}. [${s.ok ? 'OK' : 'FAIL'}] ${s.step} - ${s.detail}`,
        ),
      ];
      setDiagnoseText(lines.join('\n'));
      setDiagnoseResult({
        success: result.success,
        message: result.message,
        sampleTool: result.sampleTool,
        steps: result.steps,
      });
      if (result.success) {
        message.success(t('chat.diagnoseCompletePass', { defaultValue: 'Diagnosis complete: connection passed' }));
      } else {
        message.warning(t('chat.diagnoseCompleteFail', { defaultValue: 'Diagnosis complete: issues found' }));
      }
    } catch (error) {
      const msg = (error as Error).message || t('chat.diagnoseFailed', { defaultValue: 'Connection diagnosis failed' });
      setDiagnoseText(msg);
      setDiagnoseResult({
        success: false,
        message: msg,
        steps: [],
      });
      message.error(msg);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleCopyDiagnoseLog = async () => {
    if (!diagnoseText.trim()) {
      message.warning(t('chat.diagnoseLogEmpty', { defaultValue: 'No diagnosis log to copy' }));
      return;
    }
    try {
      await navigator.clipboard.writeText(diagnoseText);
      message.success(t('chat.diagnoseLogCopied', { defaultValue: 'Diagnosis log copied' }));
    } catch {
      message.error(t('chat.diagnoseLogCopyFailed', { defaultValue: 'Copy failed, please copy manually' }));
    }
  };

  const renderServerIcon = (icon?: string) => {
    if (typeof icon === 'string') {
      const normalized = icon.trim();
      const charLength = Array.from(normalized).length;
      if (normalized && charLength <= 2 && !normalized.includes(' ')) {
        return normalized;
      }
    }
    return <ApiOutlined />;
  };

  const buildRemoteConfigPayload = (
    values: MCPConfigFormValues,
  ): Record<string, unknown> => {
    let headers: Record<string, string> | undefined;
    if (values.headersJson?.trim()) {
      const parsed = JSON.parse(values.headersJson.trim()) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(t('chat.headersJsonMustBeObject', { defaultValue: 'Headers JSON must be an object' }));
      }
      headers = Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [
          k,
          String(v),
        ]),
      );
    }
    return {
      url: values.url?.trim() || undefined,
      bearerToken: values.bearerToken?.trim() || undefined,
      timeoutMs: values.timeoutMs || undefined,
      headers,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleOutlined className="server-status-icon server-status-icon--active" />;
      case 'error':
        return <ExclamationCircleOutlined className="server-status-icon server-status-icon--error" />;
      default:
        return <ExclamationCircleOutlined className="server-status-icon server-status-icon--warning" />;
    }
  };

  return (
    <>
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
                <List.Item className="server-item server-item--installed">
                  <div className="server-switch-top-right">
                    <Switch
                      size="small"
                      checked={server.status === 'active'}
                      onChange={() => handleToggleStatus(server)}
                    />
                  </div>
                  <List.Item.Meta
                    avatar={
                      <div className="server-icon">
                        {renderServerIcon(server.icon)}
                      </div>
                    }
                    title={
                      <div className="server-title">
                        {server.name}
                        {server.requiresConfig ? (
                          <Tag color="warning" className="server-title__tag">
                            {t('chat.mcpNeedsConfig')}
                          </Tag>
                        ) : null}
                        {getStatusIcon(server.status)}
                      </div>
                    }
                    description={
                      <div className="server-info">
                        <span className="server-tools">
                          {server.allowedTools?.length || 0} tools
                        </span>
                        {server.lastError && (
                          <Tooltip title={server.lastError}>
                            <span className="server-error">
                              {server.lastError.substring(0, 30)}...
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    }
                  />
                  <div className="server-actions">
                    <Popconfirm
                      title={t('chat.uninstallConfirm')}
                      onConfirm={() => handleUninstall(server.id)}
                      okText={t('common.ok')}
                      cancelText={t('common.cancel')}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        {t('chat.uninstall')}
                      </Button>
                    </Popconfirm>
                    {server.type !== 'builtin' ? (
                      <Button size="small" onClick={() => handleOpenConfig(server)}>
                        {t('chat.configureMcp')}
                      </Button>
                    ) : null}
                  </div>
                </List.Item>
              )}
            />
          )
        ) : (
          <>
            <div className="server-section-title">
              {t('chat.builtinServers')}
            </div>
            <List
              className="server-list"
              dataSource={builtinServers}
              locale={{ emptyText: <Empty description={t('chat.noServers')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
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
                        {renderServerIcon(server.icon)}
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

            <div className="server-section-title">
              {t('chat.marketplaceServers')}
            </div>
            <List
              className="server-list"
              dataSource={marketplaceOnlyServers}
              locale={{ emptyText: <Empty description={t('chat.noServers')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
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
                        {renderServerIcon(server.icon)}
                      </div>
                    }
                    title={server.name}
                    description={
                      <div className="server-description">
                        <span>{server.description}</span>
                        {server.requiresConfig ? (
                          <div className="server-requires-config-hint">
                            {t('chat.mcpRemoteUrlHint')}
                          </div>
                        ) : null}
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
          </>
        )}
      </div>
      </div>
      <Modal
        title={t('chat.configureMcpTitle', { name: editingServer?.name || '', defaultValue: `Configure MCP: ${editingServer?.name || ''}` })}
        open={configModalOpen}
        onCancel={() => {
          setConfigModalOpen(false);
          setEditingServer(null);
          setDiagnoseText('');
          setDiagnoseResult(null);
        }}
        onOk={() => {
          void handleSaveConfig();
        }}
        okButtonProps={{ loading: configSaving }}
        destroyOnHidden
        className="mcp-config-modal"
        footer={[
          <Button
            key="diagnose"
            loading={diagnosing}
            onClick={() => void handleDiagnoseConnection()}
          >
            {t('chat.connectDiagnostic')}
          </Button>,
          <Button key="sync" loading={syncingTools} onClick={() => void handleSyncTools()}>
            {t('chat.syncTools')}
          </Button>,
          <Button key="test" loading={testingConnection} onClick={() => void handleTestConnection()}>
            {t('chat.testConnection')}
          </Button>,
          <Button
            key="cancel"
            onClick={() => {
              setConfigModalOpen(false);
              setEditingServer(null);
              setDiagnoseText('');
              setDiagnoseResult(null);
            }}
          >
            {t('common.cancel')}
          </Button>,
          <Button key="save" type="primary" loading={configSaving} onClick={() => void handleSaveConfig()}>
            {t('common.save')}
          </Button>,
        ]}
        >
        <Form form={configForm} layout="vertical" autoComplete="off">
          {/* 防止浏览器/密码管理器误填充账号密码到 MCP 配置表单 */}
          <input
            type="text"
            name="mcp_fake_username"
            autoComplete="username"
            className="mcp-hidden-autofill-trap"
            tabIndex={-1}
            aria-hidden="true"
          />
          <input
            type="password"
            name="mcp_fake_password"
            autoComplete="current-password"
            className="mcp-hidden-autofill-trap"
            tabIndex={-1}
            aria-hidden="true"
          />
          <Form.Item
            label={t('chat.remoteMcpUrl', { defaultValue: 'Remote MCP URL' })}
            name="url"
            rules={[{ required: true, message: t('chat.remoteMcpUrlRequired', { defaultValue: 'Please enter URL' }) }]}
          >
            <Input
              placeholder="https://your-mcp-server.com/mcp"
              autoComplete="off"
              name="mcp_url"
            />
          </Form.Item>
          <Form.Item label="Bearer Token" name="bearerToken">
            <Input.Password
              placeholder={t('chat.bearerTokenPlaceholder', { defaultValue: 'Optional: remote service auth token' })}
              autoComplete="off"
              name="mcp_bearer_token"
            />
          </Form.Item>
          <Form.Item label={t('chat.timeoutLabel', { defaultValue: 'Timeout (ms)' })} name="timeoutMs">
            <Input
              type="number"
              min={1000}
              max={30000}
              autoComplete="off"
              name="mcp_timeout"
            />
          </Form.Item>
          <Form.Item label={t('chat.extraHeadersLabel', { defaultValue: 'Extra Headers (JSON)' })} name="headersJson">
            <Input.TextArea
              rows={6}
              placeholder={`{\n  "x-tenant-id": "demo"\n}`}
              autoComplete="off"
              name="mcp_headers_json"
            />
          </Form.Item>
          <Form.Item label={t('chat.diagnoseResultLabel', { defaultValue: 'Diagnosis Result' })}>
            <div className="diagnose-panel">
              {diagnoseResult ? (
                <>
                  <Alert
                    type={diagnoseResult.success ? 'success' : 'error'}
                    showIcon
                    message={diagnoseResult.success ? t('chat.connectionPass', { defaultValue: 'Connection available' }) : t('chat.connectionFail', { defaultValue: 'Connection issue' })}
                    description={
                      <div>
                        <div>{diagnoseResult.message}</div>
                        {diagnoseResult.sampleTool ? (
                          <div className="diagnose-sample-tool">
                            {t('chat.sampleToolLabel', { defaultValue: 'Sample tool: ' })}{diagnoseResult.sampleTool}
                          </div>
                        ) : null}
                      </div>
                    }
                  />
                  <div className="diagnose-steps">
                    {diagnoseResult.steps.map((step, idx) => (
                      <div
                        key={`${step.step}-${idx}`}
                        className={`diagnose-step ${step.ok ? 'ok' : 'fail'}`}
                      >
                        <div className="diagnose-step-title">
                          <span>{idx + 1}.</span>
                          <span>{step.step}</span>
                          <Tag color={step.ok ? 'success' : 'error'}>
                            {step.ok ? 'OK' : 'FAIL'}
                          </Tag>
                        </div>
                        <div className="diagnose-step-detail">{step.detail}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="diagnose-empty">
                  {t('chat.diagnoseEmptyHint', { defaultValue: 'Click "Connection Diagnostic" to view each step\'s details here' })}
                </div>
              )}
              <div className="diagnose-actions">
                <Button onClick={() => void handleCopyDiagnoseLog()}>
                  {t('chat.copyLog', { defaultValue: 'Copy Log' })}
                </Button>
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MCPServerPanel;
