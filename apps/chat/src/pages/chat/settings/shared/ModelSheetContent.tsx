import React, { useCallback } from 'react';
import { Select, Slider, Button, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useChat } from '../../context/ChatContext';
import { MODEL_VENDORS } from '../../constants';
import type { VendorType } from '../../types';

interface ModelSheetContentProps {
  onSave?: () => void;
}

const ModelSheetContent: React.FC<ModelSheetContentProps> = ({ onSave }) => {
  const { t } = useTranslation();
  const { state, dispatch, handleSaveSettings } = useChat();
  const { apiKeys, vendor, model, hasApiKeyByProvider } = state;

  const handleModelChange = useCallback(
    (value: string) => {
      const found = MODEL_VENDORS.flatMap((v) => v.models).find((m) => m.value === value);
      if (found) {
        const vendorObj = MODEL_VENDORS.find((v) => v.models.some((m) => m.value === value));
        if (vendorObj) dispatch({ type: 'SET_VENDOR', payload: vendorObj.value });
        dispatch({ type: 'SET_MODEL', payload: value });
      }
    },
    [dispatch],
  );

  const handleVendorChange = useCallback(
    (value: VendorType) => {
      dispatch({ type: 'SET_VENDOR', payload: value });
      const v = MODEL_VENDORS.find((m) => m.value === value);
      if (v?.models?.[0]) dispatch({ type: 'SET_MODEL', payload: v.models[0].value });
    },
    [dispatch],
  );

  const handleApiKeyChange = useCallback(
    (value: string) => {
      dispatch({ type: 'SET_API_KEYS', payload: { ...apiKeys, [vendor]: value } });
    },
    [dispatch, apiKeys, vendor],
  );

  const currentVendorModels = MODEL_VENDORS.find((v) => v.value === vendor)?.models || [];

  const handleSave = useCallback(async () => {
    await handleSaveSettings();
    onSave?.();
  }, [handleSaveSettings, onSave]);

  return (
    <>
      {/* 基础模型配置 */}
      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">{t('chat.vendor')}</div>
        <Select
          value={vendor}
          onChange={handleVendorChange}
          options={MODEL_VENDORS.map((v) => ({ label: v.label, value: v.value }))}
          popupMatchSelectWidth={false}
          style={{ width: '100%' }}
        />
      </div>

      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">{t('chat.selectModel')}</div>
        <Select
          value={model}
          onChange={handleModelChange}
          options={currentVendorModels}
          popupMatchSelectWidth={false}
          style={{ width: '100%' }}
        />
      </div>

      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">API Key</div>
        <Input.Password
          value={apiKeys[vendor] || ''}
          onChange={(e) => handleApiKeyChange(e.target.value)}
          placeholder="sk-..."
        />
        <div className="sub-sheet-field-hint">
          {hasApiKeyByProvider[vendor]
            ? t('chat.apiKeyConfigured')
            : t('chat.noApiKeyWarning')}
        </div>
      </div>

      <div className="sub-sheet-divider" />

      {/* 生成参数 */}
      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">
          {t('chat.temperature')}
          <span className="sub-sheet-field-value">{(state.temperature / 10).toFixed(1)}</span>
        </div>
        <Slider
          value={state.temperature}
          onChange={(v) => dispatch({ type: 'SET_TEMPERATURE', payload: v })}
          min={1}
          max={10}
          step={1}
          tooltip={{ open: false }}
        />
      </div>

      <div className="sub-sheet-field">
        <div className="sub-sheet-field-label">
          {t('chat.maxTokens')}
          <span className="sub-sheet-field-value">{state.maxTokens}</span>
        </div>
        <Slider
          value={state.maxTokens}
          onChange={(v) => dispatch({ type: 'SET_MAX_TOKENS', payload: v })}
          min={256}
          max={16384}
          step={256}
          marks={{ 256: '256', 4096: '4K', 8192: '8K', 16384: '16K' }}
          tooltip={{ open: false }}
        />
      </div>

      <div className="sub-sheet-divider" />

      {/* 思考模式 */}
      <div className="sub-sheet-field">
        <div className="sub-sheet-toggle-row">
          <div className="sub-sheet-toggle-label">{t('chat.thinkingModel')}</div>
          <div
            className={`custom-switch ${state.enableThinking ? 'checked' : ''}`}
            onClick={() => dispatch({ type: 'SET_ENABLE_THINKING', payload: !state.enableThinking })}
            role="switch"
            aria-checked={state.enableThinking}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                dispatch({ type: 'SET_ENABLE_THINKING', payload: !state.enableThinking });
              }
            }}
          >
            <div className="custom-switch-knob" />
          </div>
        </div>
      </div>

      {state.enableThinking && (
        <div className="sub-sheet-field nested">
          <div className="sub-sheet-field-label">
            {t('chat.thinkingBudget')}
            <span className="sub-sheet-field-value">{state.thinkingBudget}</span>
          </div>
          <Slider
            value={state.thinkingBudget}
            onChange={(v) => dispatch({ type: 'SET_THINKING_BUDGET', payload: v })}
            min={0}
            max={32000}
            step={1000}
            marks={{ 0: '0', 8000: '8K', 16000: '16K', 32000: '32K' }}
            tooltip={{ open: false }}
          />
        </div>
      )}

      <div className="sub-sheet-footer">
        <Button onClick={onSave}>{t('common.cancel')}</Button>
        <Button type="primary" onClick={() => void handleSave()}>
          {t('common.save')}
        </Button>
      </div>
    </>
  );
};

export default ModelSheetContent;
