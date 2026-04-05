import { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@hooks/useAuth';
import { getCurrentLocale } from '@/i18n';
import { getSiteBrand } from '@/config/site';
import '../Auth.less';

const { Title, Text } = Typography;

const Register = () => {
  const { t } = useTranslation();
  const { title, description } = getSiteBrand(getCurrentLocale());
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: Record<string, string>) => {
    try {
      setLoading(true);
      await register(values.username, values.email, values.password);
      message.success(t('auth.registerSuccess'));
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t('auth.registerFailed');
      message.error(errorMessage);
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
            <Title level={2} className="auth-title">
              {t('auth.registerTitle')}
            </Title>
            <Text className="auth-subtitle">{t('auth.registerSubtitle')}</Text>
          </div>

          <Form
            form={form}
            name="register"
            className="auth-form"
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: t('auth.pleaseEnterUsername') },
                { min: 3, message: '用户名至少需要3个字符' },
                { max: 20, message: '用户名不能超过20个字符' },
                {
                  pattern: /^[a-zA-Z0-9]+$/,
                  message: '用户名只能包含英文字母和数字',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#8a919f' }} />}
                placeholder={t('auth.pleaseEnterUsername')}
              />
            </Form.Item>

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
              name="password"
              rules={[
                { required: true, message: t('auth.pleaseEnterPassword') },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#8a919f' }} />}
                placeholder={t('auth.pleaseEnterPassword')}
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
                {t('auth.submitRegister')}
              </Button>
            </Form.Item>

            <div className="auth-footer">
              {t('auth.hasAccount')}
              <Link to="/login" className="footer-link">
                {t('auth.loginNow')}
              </Link>
            </div>
          </Form>
        </div>
      </div>

      <div className="auth-bottom">
        {t('footer.authTagline', { year, title, description })}
      </div>
    </div>
  );
};

export default Register;
