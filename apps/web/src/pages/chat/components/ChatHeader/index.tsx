import React, { memo, useMemo, useCallback } from 'react';
import { Button, Popover, Modal, Input, message, Select, Spin } from 'antd';
import { ShareAltOutlined, SettingOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useChat } from '../../context/ChatContext';
import { MODEL_VENDORS } from '../../constants';
import ChatSettingsPanel from '../ChatSettingsPanel';
import { useChatShareControllerCreate } from '@services/generated/chat-share/chat-share';

const ChatHeader: React.FC = memo(function ChatHeader() {
  const { state, dispatch, handleSaveSettings } = useChat();
  const { model, showSettings, sessions, currentSessionId } = state;
  const [shareModalOpen, setShareModalOpen] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const modelOptions = useMemo(() => {
    return MODEL_VENDORS.flatMap((v) =>
      v.models.map((m) => ({
        label: `${v.label} - ${m.label}`,
        value: m.value,
        vendor: v.value,
      }))
    );
  }, []);

  const handleModelChange = useCallback(
    (value: string) => {
      const selectedModel = MODEL_VENDORS.flatMap((v) => v.models).find((m) => m.value === value);
      if (selectedModel) {
        const selectedVendor = MODEL_VENDORS.find((v) =>
          v.models.some((m) => m.value === value)
        );
        if (selectedVendor) {
          dispatch({ type: 'SET_VENDOR', payload: selectedVendor.value });
        }
        dispatch({ type: 'SET_MODEL', payload: value });
      }
    },
    [dispatch]
  );

  const [shareLoading, setShareLoading] = React.useState(false);

  const { mutateAsync: createShare } = useChatShareControllerCreate();

  const handleShare = useCallback(async () => {
    if (!currentSessionId) {
      message.warning('请先选择一个会话');
      return;
    }
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    setShareLoading(true);
    try {
      const result = await createShare({
        data: {
          sessionId: session.id,
          messages: session.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          title: session.title,
        },
      });
      const shareLink = `${window.location.origin}/chat/share/${result.id}`;
      setShareUrl(shareLink);
      setShareModalOpen(true);
    } catch (error) {
      message.error('创建分享链接失败');
    } finally {
      setShareLoading(false);
    }
  }, [currentSessionId, sessions, createShare]);

  const handleCopyShareUrl = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    message.success('已复制分享链接');
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleCloseShareModal = useCallback(() => {
    setShareModalOpen(false);
    setShareUrl('');
    setCopied(false);
  }, []);

  const settingsContent = useMemo(
    () => (
      <ChatSettingsPanel
        apiKeys={state.apiKeys}
        vendor={state.vendor}
        model={state.model}
        temperature={state.temperature}
        maxTokens={state.maxTokens}
        contextWindow={state.contextWindow}
        enableThinking={state.enableThinking}
        thinkingBudget={state.thinkingBudget}
        useMcpTools={state.useMcpTools}
        hasApiKeyByProvider={state.hasApiKeyByProvider}
        onApiKeysChange={(keysOrFn) => {
          const newKeys = typeof keysOrFn === 'function'
            ? keysOrFn(state.apiKeys)
            : keysOrFn;
          dispatch({ type: 'SET_API_KEYS', payload: newKeys });
        }}
        onVendorChange={(v) => dispatch({ type: 'SET_VENDOR', payload: v })}
        onModelChange={(m) => dispatch({ type: 'SET_MODEL', payload: m })}
        onTemperatureChange={(t) => dispatch({ type: 'SET_TEMPERATURE', payload: t })}
        onMaxTokensChange={(t) => dispatch({ type: 'SET_MAX_TOKENS', payload: t })}
        onContextWindowChange={(c) => dispatch({ type: 'SET_CONTEXT_WINDOW', payload: c })}
        onEnableThinkingChange={(e) => dispatch({ type: 'SET_ENABLE_THINKING', payload: e })}
        onThinkingBudgetChange={(t) => dispatch({ type: 'SET_THINKING_BUDGET', payload: t })}
        onUseMcpToolsChange={(u) => dispatch({ type: 'SET_USE_MCP_TOOLS', payload: u })}
        onSave={handleSaveSettings}
        apiKeyConfiguredText="当前厂商已配置密钥（服务器端加密存储）"
        apiKeyNotConfiguredText="当前厂商未配置密钥"
      />
    ),
    [state, dispatch, handleSaveSettings]
  );

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        <Select
          value={model}
          onChange={handleModelChange}
          options={modelOptions}
          className="model-selector"
          popupMatchSelectWidth={false}
          placeholder="选择模型"
        />
      </div>
      <div className="chat-header-right">
        <Button
          type="text"
          icon={<ShareAltOutlined />}
          onClick={handleShare}
          className="header-btn"
        >
          <span className="btn-text">分享</span>
        </Button>
        <Popover
          content={settingsContent}
          trigger="click"
          placement="bottomRight"
          overlayClassName="settings-popover"
          open={showSettings}
          onOpenChange={(open) => dispatch({ type: 'SET_SHOW_SETTINGS', payload: open })}
        >
          <Button
            type="text"
            icon={<SettingOutlined />}
            className={`header-btn ${showSettings ? 'active' : ''}`}
          >
            <span className="btn-text">设置</span>
          </Button>
        </Popover>
      </div>

      <Modal
        title="分享会话"
        open={shareModalOpen}
        onCancel={handleCloseShareModal}
        footer={[
          <Button key="copy" type="primary" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={handleCopyShareUrl} disabled={!shareUrl}>
            {copied ? '已复制' : '复制链接'}
          </Button>,
        ]}
      >
        <div className="share-modal-content">
          {shareLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin tip="正在创建分享链接..." />
            </div>
          ) : (
            <>
              <p>复制以下链接分享此会话：</p>
              <Input value={shareUrl} readOnly className="share-url-input" />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
});

export default ChatHeader;
