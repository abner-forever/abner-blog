import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authControllerResetPassword } from '@services/generated/auth/auth';
import { getCurrentLocale } from '@/i18n';
import { getSiteBrand } from '@/config/site';
import '../Auth.less';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const { t } = useTranslation();
  const { title, description } = getSiteBrand(getCurrentLocale());
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: Record<string, string>) => {
    if (!token) {
      return message.error(t('auth.resetInvalidLink'));
    }
    try {
      setLoading(true);
      await authControllerResetPassword({
        token,
        newPassword: values.password,
      });
      message.success(t('auth.resetSuccess'));
      navigate('/login');
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : t('auth.resetFailed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-main">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <Title level={3}>{t('auth.invalidLinkTitle')}</Title>
            <p>{t('auth.invalidLinkDesc')}</p>
            <Button
              type="primary"
              onClick={() => navigate('/login')}
              block
              className="submit-btn"
            >
              {t('auth.backToLogin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-badge">
              <span className="logo-letter">A</span>
              <div className="logo-accent"></div>
            </div>
          </div>
          <div className="auth-card-header">
            <Title level={2} className="auth-title">
              {t('auth.resetTitle')}
            </Title>
            <Text className="auth-subtitle">{t('auth.resetSubtitle')}</Text>
          </div>

          <Form
            name="reset-password"
            className="auth-form"
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('auth.pleaseEnterNewPassword') },
                { min: 6, message: t('auth.passwordMinLength') },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#8a919f' }} />}
                placeholder={t('auth.newPasswordPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('auth.pleaseConfirmPassword') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t('auth.passwordMismatch')),
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#8a919f' }} />}
                placeholder={t('auth.confirmPasswordPlaceholder')}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                className="submit-btn"
              >
                {t('auth.submitReset')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      <div className="auth-bottom">
        {t('footer.authTagline', { year, title, description })}
      </div>
    </div>
  );
};

export default ResetPassword;
