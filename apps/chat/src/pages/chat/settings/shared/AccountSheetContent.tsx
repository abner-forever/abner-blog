import React, { useState, useCallback, useRef } from 'react';
import { Avatar, Button, Form, Input, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/reduxHooks';
import { useUsersControllerUpdateProfile } from '@services/generated/users/users';
import { useUploadControllerUploadImage } from '@services/generated/upload/upload';

interface AccountSheetContentProps {
  onSave?: () => void;
}

const AccountSheetContent: React.FC<AccountSheetContentProps> = ({ onSave }) => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    [uploadImage, t],
  );

  const handleSave = useCallback(
    async (values: { nickname?: string; bio?: string }) => {
      try {
        await updateProfile({
          nickname: values.nickname,
          bio: values.bio,
          avatar: avatarUrl,
        });
        message.success(t('chat.profileUpdateSuccess'));
        onSave?.();
      } catch {
        message.error(t('chat.updateFailed'));
      }
    },
    [updateProfile, avatarUrl, t, onSave],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
      />
      <div className="sub-sheet-avatar-section">
        <Avatar src={avatarUrl} size={64} icon={<UserOutlined />} />
        <Button size="small" loading={uploading} onClick={handleAvatarClick}>
          {t('chat.uploadAvatar')}
        </Button>
      </div>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          nickname: user?.nickname || user?.username || '',
          bio: user?.bio || '',
        }}
        onFinish={handleSave}
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
          <Input.TextArea placeholder={t('chat.bioPlaceholder')} rows={3} maxLength={200} showCount />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          {t('common.save')}
        </Button>
      </Form>
    </>
  );
};

export default AccountSheetContent;
