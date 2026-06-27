import React, { memo, useState, useCallback, useRef } from 'react';
import {
  Modal,
  Form,
  Input,
  Avatar,
  Button,
  Select,
  Slider,
  message,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  BgColorsOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAppSelector, useAppDispatch } from '@/store/reduxHooks';
import { setTheme, setSkin, skinCategories, type ThemeType } from '@/store/themeSlice';
import { useUsersControllerUpdateProfile } from '@services/generated/users/users';
import { useUploadControllerUploadImage } from '@services/generated/upload/upload';
import { useChat } from '../../context/ChatContext';
import { MODEL_VENDORS } from '../../constants';
import type { VendorType } from '../../types';
import './ChatSettingsModal.less';

type SettingsTab = 'profile' | 'model' | 'chat' | 'appearance' | 'about';

interface ChatSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

function maskApiKey(key: string): string {
  if (!key || key.length < 12) return key || '';
  const prefix = key.slice(0, 6);
  const suffix = key.slice(-4);
  return `${prefix}${'*'.repeat(Math.min(key.length - 10, 20))}${suffix}`;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = memo(function ChatSettingsModal({
  open,
  onClose,
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { state, dispatch: chatDispatch, handleSaveSettings } = useChat();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.theme.theme);
  const skin = useAppSelector((s) => s.theme.skin);

  const [activeTab, setActiveTab] = useState<SettingsTab>('model');
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    apiKeys,
    vendor,
    model,
    temperature,
    maxTokens,
    contextWindow,
    enableThinking,
    thinkingBudget,
    enableWebSearch,
    hasApiKeyByProvider,
  } = state;

  const { mutateAsync: updateProfile } = useUsersControllerUpdateProfile();
  const { mutateAsync: uploadImage } = useUploadControllerUploadImage();

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadImage(formData);
        const url = (res as unknown as { url: string }).url;
        setAvatarUrl(url);
        message.success(t('chat.avatarUploadSuccess'));
      } catch {
        message.error(t('chat.avatarUploadFailed'));
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [uploadImage, t]
  );

  const handleSaveProfile = useCallback(
    async (values: { nickname?: string; bio?: string }) => {
      try {
        await updateProfile({
          nickname: values.nickname,
          bio: values.bio,
          avatar: avatarUrl,
        });
        message.success(t('chat.profileUpdateSuccess'));
      } catch {
        message.error(t('chat.updateFailed'));
      }
    },
    [updateProfile, avatarUrl, t]
  );

  const handleThemeChange = useCallback(
    (value: ThemeType) => {
      dispatch(setTheme(value));
    },
    [dispatch]
  );

  const handleSkinChange = useCallback(
    (skinName: string) => {
      dispatch(setSkin(skinName as typeof skin));
    },
    [dispatch]
  );

  const handleLanguageChange = useCallback((value: string) => {
    i18n.changeLanguage(value);
  }, []);

  const handleSaveAll = useCallback(async () => {
    await handleSaveSettings();
    message.success(t('chat.saveSuccess'));
    onClose();
  }, [handleSaveSettings, onClose, t]);

  const handleModelChange = useCallback(
    (value: string) => {
      const found = MODEL_VENDORS.flatMap((v) => v.models).find((m) => m.value === value);
      if (found) {
        const vendorObj = MODEL_VENDORS.find((v) => v.models.some((m) => m.value === value));
        if (vendorObj) chatDispatch({ type: 'SET_VENDOR', payload: vendorObj.value });
        chatDispatch({ type: 'SET_MODEL', payload: value });
      }
    },
    [chatDispatch]
  );

  const handleVendorChange = useCallback(
    (value: VendorType) => {
      chatDispatch({ type: 'SET_VENDOR', payload: value });
      const v = MODEL_VENDORS.find((m) => m.value === value);
      if (v?.models?.[0]) chatDispatch({ type: 'SET_MODEL', payload: v.models[0].value });
    },
    [chatDispatch]
  );

  const handleApiKeyChange = useCallback(
    (value: string) => {
      chatDispatch({ type: 'SET_API_KEYS', payload: { ...apiKeys, [vendor]: value } });
    },
    [chatDispatch, apiKeys, vendor]
  );

  const currentVendorModels = MODEL_VENDORS.find((v) => v.value === vendor)?.models || [];
  const hasApiKey = hasApiKeyByProvider[vendor];
  const maskedApiKey = maskApiKey(apiKeys[vendor] || '');

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'model', label: t('chat.modelSettings'), icon: <RobotOutlined /> },
    { key: 'chat', label: t('chat.chatSettings'), icon: <ThunderboltOutlined /> },
    { key: 'profile', label: t('chat.profile'), icon: <UserOutlined /> },
    { key: 'appearance', label: t('chat.appearanceSettings'), icon: <BgColorsOutlined /> },
    { key: 'about', label: t('chat.aboutSettings'), icon: <InfoCircleOutlined /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'model':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <div className="settings-section-title">{t('chat.modelSettings')}</div>
              <div className="settings-section-desc">{t('chat.selectModelPlaceholder')}</div>
            </div>

            <div className="settings-field">
              <div className="settings-field-label">{t('chat.vendor')}</div>
              <Select
                value={vendor}
                onChange={handleVendorChange}
                options={MODEL_VENDORS.map((v) => ({ label: v.label, value: v.value }))}
                popupMatchSelectWidth={false}
              />
            </div>

            <div className="settings-field">
              <div className="settings-field-label">{t('chat.selectModel')}</div>
              <Select
                value={model}
                onChange={handleModelChange}
                options={currentVendorModels}
                popupMatchSelectWidth={false}
              />
            </div>

            <div className="settings-field">
              <div className="settings-field-label">
                API Key
                {hasApiKey && <span className="settings-badge configured">{t('chat.apiKeyConfigured')}</span>}
              </div>
              {editingApiKey || !hasApiKey ? (
                <Input.Password
                  value={apiKeys[vendor] || ''}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-..."
                />
              ) : (
                <div className="api-key-display">
                  <code>{maskedApiKey}</code>
                  <Button size="small" type="link" onClick={() => setEditingApiKey(true)}>
                    {t('chat.change')}
                  </Button>
                </div>
              )}
              <div className="settings-field-hint">
                {t('chat.apiKeyHint', { defaultValue: 'Enter your API Key, stored encrypted on the server only' })}
              </div>
            </div>

            {!hasApiKey && (
              <div className="settings-warning">
                {t('chat.noApiKeyWarning')}
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <div className="settings-section-title">{t('chat.chatSettings')}</div>
              <div className="settings-section-desc">{t('chat.sendPlaceholder')}</div>
            </div>

            <div className="settings-field">
              <div className="settings-field-label">
                {t('chat.temperature')}
                <span className="settings-field-value">{(temperature / 10).toFixed(1)}</span>
              </div>
              <Slider
                value={temperature}
                onChange={(v) => chatDispatch({ type: 'SET_TEMPERATURE', payload: v })}
                min={1}
                max={10}
                step={1}
                tooltip={{ open: false }}
              />
            </div>

            <div className="settings-field">
              <div className="settings-field-label">
                {t('chat.maxTokens')}
                <span className="settings-field-value">{maxTokens}</span>
              </div>
              <Slider
                value={maxTokens}
                onChange={(v) => chatDispatch({ type: 'SET_MAX_TOKENS', payload: v })}
                min={256}
                max={16384}
                step={256}
                marks={{ 256: '256', 4096: '4K', 8192: '8K', 16384: '16K' }}
                tooltip={{ open: false }}
              />
            </div>

            <div className="settings-field">
              <div className="settings-field-label">
                {t('chat.contextWindow')}
                <span className="settings-field-value">{contextWindow}</span>
              </div>
              <Slider
                value={contextWindow}
                onChange={(v) => chatDispatch({ type: 'SET_CONTEXT_WINDOW', payload: v })}
                min={1}
                max={20}
                step={1}
                marks={{ 1: '1', 5: '5', 10: '10', 15: '15', 20: '20' }}
                tooltip={{ open: false }}
              />
            </div>

            <div className="settings-divider" />

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <div className="settings-toggle-label">{t('chat.enableWebSearch')}</div>
                <div className="settings-toggle-desc">{t('chat.enableWebSearchHint')}</div>
              </div>
              <div
                className={`custom-switch ${enableWebSearch ? 'checked' : ''}`}
                onClick={() => chatDispatch({ type: 'SET_ENABLE_WEB_SEARCH', payload: !enableWebSearch })}
              >
                <div className="custom-switch-knob" />
              </div>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <div className="settings-toggle-label">{t('chat.thinkingModel')}</div>
                <div className="settings-toggle-desc">{t('chat.enableThinkingHint')}</div>
              </div>
              <div
                className={`custom-switch ${enableThinking ? 'checked' : ''}`}
                onClick={() => chatDispatch({ type: 'SET_ENABLE_THINKING', payload: !enableThinking })}
              >
                <div className="custom-switch-knob" />
              </div>
            </div>

            {enableThinking && (
              <div className="settings-field nested">
                <div className="settings-field-label">
                  {t('chat.thinkingBudget')}
                  <span className="settings-field-value">{thinkingBudget}</span>
                </div>
                <Slider
                  value={thinkingBudget}
                  onChange={(v) => chatDispatch({ type: 'SET_THINKING_BUDGET', payload: v })}
                  min={0}
                  max={32000}
                  step={1000}
                  marks={{ 0: '0', 8000: '8K', 16000: '16K', 32000: '32K' }}
                  tooltip={{ open: false }}
                />
              </div>
            )}

          </div>
        );

      case 'profile':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <div className="settings-section-title">{t('chat.profileSettings')}</div>
            </div>

            <div className="avatar-upload-area">
              <Avatar src={avatarUrl} size={72} icon={<UserOutlined />} />
              <div className="avatar-upload-info">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <Button size="small" loading={uploading} onClick={handleAvatarClick}>
                  {t('chat.uploadAvatar')}
                </Button>
                <span className="avatar-hint">JPG / PNG, 2MB</span>
              </div>
            </div>

            <Form
              form={form}
              layout="vertical"
              initialValues={{
                nickname: user?.nickname || user?.username || '',
                bio: user?.bio || '',
              }}
              onFinish={handleSaveProfile}
            >
              <Form.Item
                name="nickname"
                label={t('chat.nickname')}
                rules={[{ max: 30, message: t('chat.nicknameMaxLength') }]}
              >
                <Input placeholder={t('chat.nicknamePlaceholder')} maxLength={30} />
              </Form.Item>
              <Form.Item
                name="bio"
                label={t('chat.bio')}
                rules={[{ max: 200, message: t('chat.bioMaxLength') }]}
              >
                <Input.TextArea
                  placeholder={t('chat.bioPlaceholder')}
                  rows={3}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>
                {t('common.save')}
              </Button>
            </Form>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <div className="settings-section-title">{t('chat.appearanceSettings')}</div>
            </div>

            <div className="settings-field">
              <div className="settings-field-label">{t('chat.darkMode')}</div>
              <Select
                value={theme}
                onChange={handleThemeChange}
                style={{ width: 160 }}
                options={[
                  { label: t('chat.followSystem', { defaultValue: '跟随系统' }), value: 'system' },
                  { label: t('chat.darkMode'), value: 'dark' },
                  { label: t('chat.lightMode', { defaultValue: '浅色' }), value: 'light' },
                ]}
              />
            </div>

            <div className="settings-field">
              <div className="settings-field-label">{t('chat.skin')}</div>
              <div className="skin-grid">
                {skinCategories.classic.skins.map((skinName) => (
                  <Tooltip key={skinName} title={skinName} placement="top">
                    <div
                      className={`skin-chip ${skin === skinName ? 'active' : ''}`}
                      onClick={() => handleSkinChange(skinName)}
                    >
                      <div className={`skin-dot skin-${skinName}`} />
                      {skin === skinName && <span className="skin-check">✓</span>}
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="settings-divider" />

            <div className="settings-field">
              <div className="settings-field-label">
                <GlobalOutlined style={{ marginRight: 6 }} />
                {t('chat.language')}
              </div>
              <Select
                value={i18n.language?.split('-')[0] === 'zh' && i18n.language?.includes('TW') ? 'zh-TW' : i18n.language?.startsWith('zh') ? 'zh-CN' : 'en'}
                onChange={handleLanguageChange}
                style={{ width: 160 }}
                options={[
                  { label: '中文', value: 'zh-CN' },
                  { label: '繁體中文', value: 'zh-TW' },
                  { label: 'English', value: 'en' },
                ]}
              />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="settings-tab-content">
            <div className="settings-section">
              <div className="settings-section-title">{t('chat.aboutSettings')}</div>
            </div>

            <div className="about-info">
              <div className="about-row">
                <span className="about-label">{t('chat.currentModel')}</span>
                <span className="about-value">{MODEL_VENDORS.find((v) => v.value === vendor)?.label} / {model}</span>
              </div>
              <div className="about-row">
                <span className="about-label">{t('chat.systemVersion')}</span>
                <span className="about-value">v1.0.0</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      className="chat-settings-modal"
    >
      <div className="settings-layout">
        <div className="settings-nav">
          <div className="settings-nav-header">{t('chat.settings')}</div>
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`settings-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </div>
          ))}
        </div>
        <div className="settings-content">
          <div className="settings-content-scroll">
            {renderContent()}
          </div>
          {activeTab !== 'profile' && activeTab !== 'about' && (
            <div className="settings-footer">
              <Button onClick={onClose}>{t('common.cancel')}</Button>
              <Button type="primary" onClick={handleSaveAll}>
                {t('chat.saveConfig')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
});

export default ChatSettingsModal;
