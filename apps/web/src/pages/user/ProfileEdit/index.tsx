import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Avatar,
  Typography,
  Divider,
  Breadcrumb,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  SaveOutlined,
  ScissorOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { usersControllerUpdateProfile } from '../../../services/generated/users/users';
import { UploadStatus } from '@abner-blog/upload';
import { createSimpleImageUploader } from '../../../services/simpleImageUploader';
import type { UpdateProfileDto } from '@services/generated/model';
import { updateUser } from '../../../store/authSlice';
import type { RootState } from '../../../store';
import AvatarCropModal from '@/components/AvatarCropModal';
import '../UserPages.less';
import type { AxiosError } from 'axios';

const { Text } = Typography;

const ProfileEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.avatar ?? undefined,
  );

  // 裁剪弹窗
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        nickname: user.nickname || '',
        email: user.email,
        bio: user.bio,
      });
      setAvatarUrl(user.avatar ?? undefined);
    }
  }, [user, form]);

  const onFinish = async (values: UpdateProfileDto) => {
    setLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        ...values,
        avatar: avatarUrl,
      };
      const data = await usersControllerUpdateProfile(
        updateData as Parameters<typeof usersControllerUpdateProfile>[0],
      );
      dispatch(updateUser(data as Parameters<typeof updateUser>[0]));
      message.success(t('profile.updateSuccess'));
      navigate('/profile');
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      message.error(err.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  /** 读取文件 → 转 DataURL → 打开裁剪弹窗 */
  const openCropModal = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error(t('profile.uploadFormatError'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        setRawImageSrc(src);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  /** 用户点击头像区域触发文件选择 */
  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) openCropModal(file);
    };
    input.click();
  };

  /** 裁剪确认后压缩并上传 */
  const handleCropConfirm = async (croppedFile: File) => {
    setCropModalOpen(false);
    setRawImageSrc('');
    setUploading(true);
    try {
      const task = await createSimpleImageUploader('avatars').upload(
        croppedFile,
      );
      if (task.status !== UploadStatus.COMPLETED || !task.url) {
        throw new Error(task.error || '上传失败');
      }
      setAvatarUrl(task.url);
      message.success(t('profile.avatarSuccess'));
    } catch {
      message.error(t('profile.avatarFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setRawImageSrc('');
  };

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-header">
        <Breadcrumb
          items={[
            { title: <a onClick={() => navigate('/')}>{t('nav.home')}</a> },
            {
              title: (
                <a onClick={() => navigate('/profile')}>{t('nav.profile')}</a>
              ),
            },
            { title: t('profile.editTitle') },
          ]}
        />
      </div>

      <Card className="edit-card" bordered={false}>
        <div className="edit-layout">
          {/* 头像区域 */}
          <div className="avatar-section">
            <Tooltip title="点击更换头像">
              <div
                className={`avatar-preview-wrapper clickable ${uploading ? 'uploading' : ''}`}
                onClick={handleAvatarClick}
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
                  <div className="avatar-upload-loading">
                    {t('profile.uploading')}
                  </div>
                )}
              </div>
            </Tooltip>

            <Button
              icon={<UploadOutlined />}
              loading={uploading}
              className="upload-btn"
              onClick={handleAvatarClick}
            >
              {t('profile.changeAvatar')}
            </Button>
            <Text type="secondary" className="upload-tip">
              支持 JPG / PNG / WebP，自动裁剪压缩
            </Text>
          </div>

          <Divider type="vertical" className="edit-divider" />

          {/* 资料表单 */}
          <div className="form-section">
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

              <Form.Item
                label={t('profile.email')}
                name="email"
                rules={[
                  { required: true, message: t('profile.emailRequired') },
                  { type: 'email', message: t('auth.validEmail') },
                ]}
              >
                <Input placeholder={t('profile.emailPlaceholder')} disabled />
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
        </div>
      </Card>

      {/* 头像裁剪弹窗 */}
      <AvatarCropModal
        open={cropModalOpen}
        imageSrc={rawImageSrc}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};

export default ProfileEdit;
