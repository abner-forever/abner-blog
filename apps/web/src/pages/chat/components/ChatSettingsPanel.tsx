import React from 'react';
import { Button, Input, Select, Slider, Switch } from 'antd';
import { MODEL_VENDORS } from '../constants';
import type { VendorType } from '../types';

interface Props {
  apiKeys: Record<string, string>;
  vendor: VendorType;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  enableThinking: boolean;
  thinkingBudget: number;
  useMcpTools: boolean;
  hasApiKeyByProvider: Record<string, boolean>;
  onApiKeysChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onVendorChange: (value: VendorType) => void;
  onModelChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onContextWindowChange: (value: number) => void;
  onEnableThinkingChange: (value: boolean) => void;
  onThinkingBudgetChange: (value: number) => void;
  onUseMcpToolsChange: (value: boolean) => void;
  onSave: () => void;
  apiKeyConfiguredText: string;
  apiKeyNotConfiguredText: string;
}

const ChatSettingsPanel: React.FC<Props> = ({
  apiKeys,
  vendor,
  model,
  temperature,
  maxTokens,
  contextWindow,
  enableThinking,
  thinkingBudget,
  useMcpTools,
  hasApiKeyByProvider,
  onApiKeysChange,
  onVendorChange,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
  onContextWindowChange,
  onEnableThinkingChange,
  onThinkingBudgetChange,
  onUseMcpToolsChange,
  onSave,
  apiKeyConfiguredText,
  apiKeyNotConfiguredText,
}) => {
  return (
    <div className="settings-panel">
      <div className="settings-group">
        <div className="settings-label">API Key</div>
        <Input.Password
          value={apiKeys[vendor] || ''}
          onChange={(e) =>
            onApiKeysChange((prev) => ({
              ...prev,
              [vendor]: e.target.value,
            }))
          }
          placeholder="请输入 API Key"
        />
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
          {hasApiKeyByProvider[vendor] ? apiKeyConfiguredText : apiKeyNotConfiguredText}
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-label">模型厂商</div>
        <Select
          value={vendor}
          onChange={onVendorChange}
          style={{ width: '100%' }}
          options={MODEL_VENDORS.map((v) => ({
            label: v.label,
            value: v.value,
          }))}
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">模型版本</div>
        <Select
          value={model}
          onChange={onModelChange}
          style={{ width: '100%' }}
          options={MODEL_VENDORS.find((v) => v.value === vendor)?.models || []}
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">
          温度 (Creativity)
          <span className="settings-value">{temperature / 10}</span>
        </div>
        <Slider
          value={temperature}
          onChange={onTemperatureChange}
          min={1}
          max={10}
          step={1}
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">
          最大 Token
          <span className="settings-value">{maxTokens}</span>
        </div>
        <Slider
          value={maxTokens}
          onChange={onMaxTokensChange}
          min={256}
          max={8192}
          step={256}
          marks={{ 256: '256', 4096: '4K', 8192: '8K' }}
        />
      </div>

      <div className="settings-group">
        <div className="settings-label">
          上下文轮数
          <span className="settings-value">{contextWindow}</span>
        </div>
        <Slider
          value={contextWindow}
          onChange={onContextWindowChange}
          min={1}
          max={20}
          step={1}
        />
      </div>

      <div className="settings-group switch-group">
        <div className="settings-label">思考模型</div>
        <Select
          value={enableThinking}
          onChange={onEnableThinkingChange}
          options={[
            { label: '开启', value: true },
            { label: '关闭', value: false },
          ]}
        />
      </div>

      <div className="settings-group switch-group">
        <div className="settings-label">
          MCP 工具模式
          <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>
            (通过 MCP 协议调用天气、日程等工具)
          </span>
        </div>
        <Switch checked={useMcpTools} onChange={onUseMcpToolsChange} />
      </div>

      <div className="settings-group">
        <div className="settings-label">
          思考预算
          <span className="settings-value">{thinkingBudget}</span>
        </div>
        <Slider
          value={thinkingBudget}
          onChange={onThinkingBudgetChange}
          min={0}
          max={32000}
          step={1000}
        />
      </div>

      <Button type="primary" block onClick={onSave}>
        保存配置
      </Button>
    </div>
  );
};

export default ChatSettingsPanel;
