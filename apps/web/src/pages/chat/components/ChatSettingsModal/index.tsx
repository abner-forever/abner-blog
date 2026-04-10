import React, { memo, useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Avatar,
  Switch,
  Button,
  message,
} from 'antd';
import {
  UserOutlined,
  SafetyOutlined,
  SettingOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/reduxHooks';
import { setTheme, setSkin, skinCategories } from '@/store/themeSlice';
import { useUsersControllerUpdateProfile } from '@services/generated/users/users';
import { useUploadControllerUploadImage } from '@services/generated/upload/upload';
import './ChatSettingsModal.less';

type SettingsTab = 'profile' | 'security' | 'general';

interface ChatSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = memo(function ChatSettingsModal({
  open,
  onClose,
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const theme = useAppSelector((s) => s.theme.theme);
  const skin = useAppSelector((s) => s.theme.skin);

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);

  const { mutateAsync: updateProfile } = useUsersControllerUpdateProfile();
  const { mutateAsync: uploadImage } = useUploadControllerUploadImage();

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const res = await uploadImage({
          data: { file },
        });
        const url = (res as unknown as { url: string }).url;
        setAvatarUrl(url);
        message.success(t('chat.avatarUploadSuccess') || '头像上传成功');
      } catch (_err) {
        message.error(t('chat.avatarUploadFailed') || '头像上传失败');
      } finally {
        setUploading(false);
      }
    },
    [uploadImage, t]
  );

  const handleSaveProfile = useCallback(
    async (values: { nickname?: string; bio?: string }) => {
      try {
        await updateProfile({
          data: {
            nickname: values.nickname,
            bio: values.bio,
            avatar: avatarUrl,
          },
        });
        message.success(t('chat.profileUpdateSuccess') || '个人信息已更新');
        onClose();
      } catch (_err) {
        message.error(t('chat.updateFailed') || '更新失败');
      }
    },
    [updateProfile, avatarUrl, onClose, t]
  );

  const handleThemeChange = useCallback(
    (checked: boolean) => {
      dispatch(setTheme(checked ? 'dark' : 'light'));
    },
    [dispatch]
  );

  const handleSkinChange = useCallback(
    (skinName: string) => {
      dispatch(setSkin(skinName as typeof skin));
    },
    [dispatch]
  );

  const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: t('chat.profile'), icon: <UserOutlined /> },
    { key: 'security', label: t('chat.security'), icon: <SafetyOutlined /> },
    { key: 'general', label: t('chat.general'), icon: <SettingOutlined /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="settings-tab-content">
            <div className="section-header">
              <UserOutlined />
              <span>{t('chat.profileSettings')}</span>
            </div>

            <div className="avatar-upload">
              <Avatar src={avatarUrl} size={80} icon={<UserOutlined />} />
              <div className="avatar-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button size="small" loading={uploading}>
                    {t('chat.uploadAvatar')}
                  </Button>
                </label>
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

      case 'security':
        return (
          <div className="settings-tab-content">
            <div className="section-header">
              <SafetyOutlined />
              <span>{t('chat.securitySettings')}</span>
            </div>

            <div className="settings-item">
              <div className="settings-item-label">{t('chat.changePassword')}</div>
              <Button>{t('chat.change')}</Button>
            </div>

            <div className="settings-item">
              <div className="settings-item-label">{t('chat.twoFactor')}</div>
              <Switch />
            </div>

            <div className="settings-item">
              <div className="settings-item-label">{t('chat.loginHistory')}</div>
              <Button size="small">{t('chat.view')}</Button>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="settings-tab-content">
            <div className="section-header">
              <BgColorsOutlined />
              <span>{t('chat.themeSettings')}</span>
            </div>

            <div className="settings-item">
              <div className="settings-item-label">{t('chat.darkMode')}</div>
              <Switch checked={theme === 'dark'} onChange={handleThemeChange} />
            </div>

            <div className="settings-item vertical">
              <div className="settings-item-label">{t('chat.skin')}</div>
              <div className="skin-selector">
                <div className="skin-options">
                  {skinCategories.classic.skins.map((skinName) => (
                    <div
                      key={skinName}
                      className={`skin-option ${skin === skinName ? 'active' : ''}`}
                      onClick={() => handleSkinChange(skinName)}
                      title={skinName}
                    >
                      <div className={`skin-preview skin-${skinName}`} />
                    </div>
                  ))}
                </div>
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
      title={t('chat.settings')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      className="chat-settings-modal"
    >
      <div className="settings-layout">
        <div className="settings-nav">
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
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
});

export default ChatSettingsModal;
