import React from 'react';
import { Button, Form, Input, Typography } from 'antd';
import { MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { FormInstance } from 'antd';

const { Text } = Typography;

interface ChangePasswordFormValues {
  code: string;
  newPassword: string;
  confirmPassword: string;
}

interface SecuritySectionProps {
  form: FormInstance<ChangePasswordFormValues>;
  maskedEmail: string;
  countdown: number;
  codeLoading: boolean;
  securityLoading: boolean;
  onSendCode: () => Promise<void>;
  onFinish: (values: ChangePasswordFormValues) => Promise<void>;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  form,
  maskedEmail,
  countdown,
  codeLoading,
  securityLoading,
  onSendCode,
  onFinish,
}) => {
  const { t } = useTranslation();

  return (
    <div className="security-section">
      <div className="security-section__header">
        <SafetyCertificateOutlined />
        <Text strong>{t('profile.securityTitle')}</Text>
      </div>
      <Text type="secondary" className="security-section__desc">
        {t('profile.securityDesc')}
      </Text>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        className="security-section__form"
        autoComplete="off"
      >
        <Form.Item label={t('profile.email')} className="security-section__email">
          <Input value={maskedEmail} disabled autoComplete="off" />
        </Form.Item>
        <Form.Item
          label={t('profile.verifyCode')}
          name="code"
          rules={[{ required: true, message: t('profile.verifyCodeRequired') }]}
        >
          <div className="security-section__code-row">
            <Input
              prefix={<SafetyCertificateOutlined />}
              placeholder={t('profile.verifyCodePlaceholder')}
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
            <Button
              icon={<MailOutlined />}
              onClick={onSendCode}
              loading={codeLoading}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}s` : t('profile.sendCode')}
            </Button>
          </div>
        </Form.Item>
        <Form.Item
          label={t('profile.newPassword')}
          name="newPassword"
          rules={[
            { required: true, message: t('profile.newPasswordRequired') },
            { min: 6, message: t('profile.newPasswordMin') },
          ]}
        >
          <Input.Password
            placeholder={t('profile.newPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item
          label={t('profile.confirmPassword')}
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: t('profile.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('profile.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder={t('profile.confirmPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item className="security-section__actions">
          <Button type="primary" htmlType="submit" loading={securityLoading}>
            {t('profile.confirmChangePassword')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SecuritySection;
