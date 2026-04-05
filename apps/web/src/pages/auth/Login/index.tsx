import { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Tabs } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useAuth } from '@hooks/useAuth';
import { authControllerSendCode } from '@services/generated/auth/auth';
import {
  resolveAuthCaptchaFields,
  TencentCaptchaUserClosedError,
} from '@/utils/tencent-captcha';
import { closeLoginModal } from '@/store/loginModalSlice';
import { getCurrentLocale } from '@/i18n';
import { getSiteBrand } from '@/config/site';
import '../Auth.less';

const { Title, Text } = Typography;

const Login = () => {
  const { t } = useTranslation();
  const { title, description } = getSiteBrand(getCurrentLocale());
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  const { login, loginByCode } = useAuth();
  const [form] = Form.useForm();
  const [codeForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('password');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onFinish = async (values: Record<string, string>) => {
    try {
      setLoading(true);
      if (activeTab === 'password') {
        let captchaFields: Awaited<
          ReturnType<typeof resolveAuthCaptchaFields>
        > = {};
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
        await login(values.username, values.password, captchaFields);
      } else {
        await loginByCode(values.email, values.code);
      }
      message.success(t('auth.loginSuccess'));
      dispatch(closeLoginModal());
      navigate(returnUrl);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('auth.loginFailed');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    try {
      const email = codeForm.getFieldValue('email');
      if (!email) {
        return message.warning(t('auth.pleaseEnterEmailWarning'));
      }
      let captchaFields: Awaited<
        ReturnType<typeof resolveAuthCaptchaFields>
      > = {};
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
      message.success(t('auth.codeSent'));
      setCountdown(60);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('auth.sendCodeFailed');
      message.error(errorMessage);
    }
  };

  const items = [
    {
      key: 'password',
      label: t('auth.passwordLogin'),
      children: (
        <Form
          form={form}
          name="login"
          className="auth-form"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('auth.pleaseEnterUsername') }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8a919f' }} />}
              placeholder={t('auth.usernameOrEmailPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.pleaseEnterPassword') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8a919f' }} />}
              placeholder={t('auth.pleaseEnterPassword')}
            />
          </Form.Item>

          <div style={{ marginBottom: 24, textAlign: 'right' }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 14, color: 'var(--primary-color)' }}
            >
              {t('auth.forgotPasswordLink')}
            </Link>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="submit-btn"
            >
              {t('auth.submitLogin')}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'code',
      label: t('auth.codeLogin'),
      children: (
        <Form
          form={codeForm}
          name="login-code"
          className="auth-form"
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('auth.pleaseEnterEmail') },
              { type: 'email', message: t('auth.validEmail') },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#8a919f' }} />}
              placeholder={t('auth.pleaseEnterEmail')}
            />
          </Form.Item>

          <Form.Item
            name="code"
            rules={[{ required: true, message: t('auth.pleaseEnterCode') }]}
          >
            <div className="code-input-group">
              <Input
                prefix={
                  <SafetyCertificateOutlined style={{ color: '#8a919f' }} />
                }
                placeholder={t('auth.pleaseEnterCode')}
              />
              <Button
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="send-code-btn"
              >
                {countdown > 0 ? `${countdown}s` : t('auth.getCode')}
              </Button>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="submit-btn"
            >
              {t('auth.submitLogin')}
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

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
              {t('auth.welcomeBack')}
            </Title>
            <Text className="auth-subtitle">{t('auth.loginSubtitle')}</Text>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            centered
            style={{ marginBottom: 16 }}
          />

          <div className="auth-footer">
            {t('auth.noAccountYet')}
            <Link to="/register" className="footer-link">
              {t('auth.registerNow')}
            </Link>
          </div>
        </div>
      </div>

      <div className="auth-bottom">
        {t('footer.authTagline', { year, title, description })}
      </div>
    </div>
  );
};

export default Login;
