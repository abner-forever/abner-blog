import React from 'react';
import { Avatar, Button, Form, Input, Tooltip, Typography } from 'antd';
import {
  SaveOutlined,
  ScissorOutlined,
  SmileOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { FormInstance } from 'antd';
import type { UpdateProfileDto } from '@services/generated/model';

const { Text } = Typography;

interface BasicProfileSectionProps {
  form: FormInstance<UpdateProfileDto>;
  avatarUrl?: string;
  uploading: boolean;
  loading: boolean;
  maskedEmail: string;
  onAvatarClick: () => void;
  onFinish: (values: UpdateProfileDto) => Promise<void>;
}

const BasicProfileSection: React.FC<BasicProfileSectionProps> = ({
  form,
  avatarUrl,
  uploading,
  loading,
  maskedEmail,
  onAvatarClick,
  onFinish,
}) => {
  const { t } = useTranslation();

  return (
    <div className="basic-section">
      <div className="avatar-section">
        <Tooltip title="点击更换头像">
          <div
            className={`avatar-preview-wrapper clickable ${uploading ? 'uploading' : ''}`}
            onClick={onAvatarClick}
          >
            <Avatar
              size={120}
              src={avatarUrl}
              icon={<UserOutlined />}
              className="profile-avatar"
            />
            <div className="avatar-hover-mask">
              <ScissorOutlined />
              <span>裁剪上传</span>
            </div>
            {uploading && (
              <div className="avatar-upload-loading">{t('profile.uploading')}</div>
            )}
          </div>
        </Tooltip>

        <div className="avatar-actions">
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            className="upload-btn"
            onClick={onAvatarClick}
          >
            {t('profile.changeAvatar')}
          </Button>
          <Text type="secondary" className="upload-tip">
            支持 JPG / PNG / WebP，自动裁剪压缩
          </Text>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          label={t('profile.username')}
          name="username"
          rules={[
            { required: true, message: t('profile.usernameRequired') },
            { min: 2, message: t('profile.usernameMin') },
            { max: 20, message: '用户名最长20个字符' },
            {
              pattern: /^[a-zA-Z0-9]+$/,
              message: '用户名只能包含英文字母和数字',
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder={t('profile.usernamePlaceholder')}
            maxLength={20}
          />
        </Form.Item>

        <Form.Item label="昵称" name="nickname" extra="每天最多修改3次">
          <Input
            prefix={<SmileOutlined />}
            placeholder="输入昵称（可以是中文）"
            maxLength={30}
          />
        </Form.Item>

        <Form.Item label={t('profile.email')}>
          <Input value={maskedEmail} disabled />
        </Form.Item>

        <Form.Item label={t('profile.bio')} name="bio">
          <Input.TextArea
            rows={4}
            placeholder={t('profile.bioPlaceholder')}
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item className="form-actions">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            block
            size="large"
          >
            {t('profile.saveChange')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default BasicProfileSection;
