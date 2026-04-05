import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authControllerRequestReset } from '@services/generated/auth/auth';
import { getCurrentLocale } from '@/i18n';
import { getSiteBrand } from '@/config/site';
import '../Auth.less';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { title, description } = getSiteBrand(getCurrentLocale());
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onFinish = async (values: { email: string }) => {
    try {
      setLoading(true);
      await authControllerRequestReset({ email: values.email });
      setSent(true);
      message.success(t('auth.sendResetSuccess'));
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : t('auth.requestFailed');
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: 'var(--text-secondary)',
                marginBottom: 16,
              }}
            >
              <ArrowLeftOutlined style={{ marginRight: 8 }} />{' '}
              {t('auth.backToLogin')}
            </Link>
            <Title level={2} className="auth-title">
              {t('auth.forgotTitle')}
            </Title>
            <Text className="auth-subtitle">{t('auth.forgotSubtitle')}</Text>
          </div>

          {!sent ? (
            <Form
              name="forgot-password"
              className="auth-form"
              onFinish={onFinish}
              size="large"
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('auth.pleaseEnterEmail') },
                  { type: 'email', message: t('auth.validEmailShort') },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#8a919f' }} />}
                  placeholder={t('auth.pleaseEnterRegisterEmail')}
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
                  {t('auth.sendResetLink')}
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  fontSize: 16,
                  marginBottom: 24,
                  color: 'var(--text-main)',
                }}
              >
                {t('auth.resetLinkSent')}
              </div>
              <Button
                type="primary"
                onClick={() => navigate('/login')}
                block
                className="submit-btn"
              >
                {t('auth.backToLogin')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="auth-bottom">
        {t('footer.authTagline', { year, title, description })}
      </div>
    </div>
  );
};

export default ForgotPassword;
