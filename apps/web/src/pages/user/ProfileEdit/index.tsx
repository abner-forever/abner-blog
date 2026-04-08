import React, { useState, useEffect } from 'react';
import { Breadcrumb, Card, Form, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { usersControllerUpdateProfile } from '../../../services/generated/users/users';
import {
  authControllerSendCode,
  authControllerChangePasswordByCode,
} from '@services/generated/auth/auth';
import { UploadStatus } from '@abner-blog/upload';
import { createSimpleImageUploader } from '../../../services/simpleImageUploader';
import type { UpdateProfileDto } from '@services/generated/model';
import { updateUser } from '../../../store/authSlice';
import type { RootState } from '../../../store';
import AvatarCropModal from '@/components/AvatarCropModal';
import {
  resolveAuthCaptchaFields,
  TencentCaptchaUserClosedError,
} from '@/utils/tencent-captcha';
import '../UserPages.less';
import type { AxiosError } from 'axios';
import EditSectionNav from './components/EditSectionNav';
import BasicProfileSection from './components/BasicProfileSection';
import SecuritySection from './components/SecuritySection';
import { maskEmail } from './utils';
import type { EditSection } from './types';

const ProfileEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [form] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeSection, setActiveSection] = useState<EditSection>('basic');
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    user?.avatar ?? undefined,
  );

  // 裁剪弹窗
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const maskedEmail = maskEmail(user?.email);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        nickname: user.nickname || '',
        bio: user.bio,
      });
      setAvatarUrl(user.avatar ?? undefined);
    }
  }, [user, form]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

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

  const handleSendCode = async () => {
    const email = user?.email;
    if (!email) {
      message.warning(t('profile.emailMissing'));
      return;
    }
    try {
      setCodeLoading(true);
      let captchaFields: Awaited<ReturnType<typeof resolveAuthCaptchaFields>> = {};
      try {
        captchaFields = await resolveAuthCaptchaFields();
      } catch (captchaErr: unknown) {
        if (captchaErr instanceof TencentCaptchaUserClosedError) {
          message.warning(t('auth.captchaUserClosed'));
          return;
        }
        message.error(t('auth.captchaFailed'));
        return;
      }
      await authControllerSendCode({ email, ...captchaFields });
      message.success(t('profile.codeSent'));
      setCountdown(60);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      message.error(err.response?.data?.message || t('profile.sendCodeFailed'));
    } finally {
      setCodeLoading(false);
    }
  };

  const handleChangePassword = async (values: {
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setSecurityLoading(true);
      await authControllerChangePasswordByCode({
        code: values.code,
        newPassword: values.newPassword,
      });
      message.success(t('profile.passwordChangeSuccess'));
      securityForm.resetFields();
      setCountdown(0);
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      message.error(err.response?.data?.message || t('profile.passwordChangeFailed'));
    } finally {
      setSecurityLoading(false);
    }
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
          <EditSectionNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <div className="form-section">
            {activeSection === 'basic' ? (
              <BasicProfileSection
                form={form}
                avatarUrl={avatarUrl}
                uploading={uploading}
                loading={loading}
                maskedEmail={maskedEmail}
                onAvatarClick={handleAvatarClick}
                onFinish={onFinish}
              />
            ) : (
              <SecuritySection
                form={securityForm}
                maskedEmail={maskedEmail}
                countdown={countdown}
                codeLoading={codeLoading}
                securityLoading={securityLoading}
                onSendCode={handleSendCode}
                onFinish={handleChangePassword}
              />
            )}
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
