import React, { useState } from 'react';
import { Modal, Tabs, Form, Input, Button, message } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/reduxHooks';
import { useTranslation } from 'react-i18next';
import {
  authControllerLogin,
  authControllerSendCode,
  authControllerLoginByCode,
} from '@services/generated/auth/auth';
import {
  resolveAuthCaptchaFields,
  TencentCaptchaUserClosedError,
} from '@/utils/tencent-captcha';
import { loginSuccess } from '@/store/authSlice';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onClose,
  onLoginSuccess,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [passwordForm] = Form.useForm(); // 密码登录专用 form
  const [codeForm] = Form.useForm(); // 验证码登录专用 form
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password');
  const [countdown, setCountdown] = useState(0);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleCancel = () => {
    passwordForm.resetFields();
    codeForm.resetFields();
    setActiveTab('password');
    onClose();
  };

  // 切换 Tab 时重置对应表单
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'password') passwordForm.resetFields();
    else codeForm.resetFields();
  };

  // 密码登录（支持 用户名 或 邮箱）
  const handlePasswordLogin = async (values: {
    username: string;
    password: string;
  }) => {
    setLoading(true);
    try {
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
      const data = (await authControllerLogin({
        username: values.username,
        password: values.password,
        captchaTicket: captchaFields.captchaTicket,
        captchaRandstr: captchaFields.captchaRandstr,
      })) as { access_token: string; user: unknown };

      if (data?.access_token) {
        localStorage.setItem('user-token', data.access_token);
        dispatch(
          loginSuccess({
            user: data.user,
            access_token: data.access_token,
          } as Parameters<typeof loginSuccess>[0]),
        );
        message.success(t('auth.loginSuccess'));
        handleCancel();
        onLoginSuccess?.();
      }
    } catch (error: unknown) {
      message.error(
        (error as { message?: string })?.message || t('auth.loginFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      await codeForm.validateFields(['email']);
    } catch {
      return;
    }
    const email = codeForm.getFieldValue('email') as string;
    try {
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
        message.error(t('auth.sendCodeFailed'));
        return;
      }
      await authControllerSendCode({ email, ...captchaFields });
      message.success(t('auth.codeSent'));
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: unknown) {
      message.error(
        (error as { message?: string })?.message || t('auth.sendCodeFailed'),
      );
    }
  };

  // 验证码登录
  const handleCodeLogin = async (values: { email: string; code: string }) => {
    setLoading(true);
    try {
      const data = (await authControllerLoginByCode({
        email: values.email,
        code: values.code,
      })) as { access_token: string; user: unknown };

      if (data?.access_token) {
        localStorage.setItem('user-token', data.access_token);
        dispatch(
          loginSuccess({
            user: data.user,
            access_token: data.access_token,
          } as Parameters<typeof loginSuccess>[0]),
        );
        message.success(t('auth.loginSuccess'));
        handleCancel();
        onLoginSuccess?.();
      }
    } catch (error: unknown) {
      message.error(
        (error as { message?: string })?.message || t('auth.loginFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    handleCancel();
    navigate('/register');
  };
  const handleGoToForgotPassword = () => {
    handleCancel();
    navigate('/forgot-password');
  };

  // 已登录时自动关闭
  React.useEffect(() => {
    if (isAuthenticated && open) {
      handleCancel();
      onLoginSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      destroyOnHidden
      className="login-modal"
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>
          {t('auth.welcomeBack')}
        </h2>
        <p style={{ color: '#888', margin: 0 }}>{t('auth.loginSubtitle')}</p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        centered
        style={{ marginBottom: 0 }}
        items={[
          {
            key: 'password',
            label: t('auth.passwordLogin'),
            children: (
              // 密码登录表单：username（支持用户名/邮箱）+ password
              <Form
                form={passwordForm}
                onFinish={handlePasswordLogin}
                layout="vertical"
                style={{ marginTop: 8 }}
              >
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: t('auth.pleaseEnterUsername') },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder={t('auth.usernameOrEmailPlaceholder')}
                    size="large"
                    autoComplete="username"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: t('auth.pleaseEnterPassword') },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder={t('auth.pleaseEnterPassword')}
                    size="large"
                    autoComplete="current-password"
                  />
                </Form.Item>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: 16,
                  }}
                >
                  <Button
                    type="link"
                    onClick={handleGoToForgotPassword}
                    style={{ padding: 0, fontSize: 13 }}
                  >
                    {t('auth.forgotPasswordLink')}
                  </Button>
                </div>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                  >
                    {t('auth.submitLogin')}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: '#888', fontSize: 13 }}>
                    {t('auth.noAccountYet')}
                  </span>
                  <Button
                    type="link"
                    onClick={handleGoToRegister}
                    style={{ fontSize: 13 }}
                  >
                    {t('auth.registerNow')}
                  </Button>
                </div>
              </Form>
            ),
          },
          {
            key: 'code',
            label: t('auth.codeLogin'),
            children: (
              // 验证码登录表单：email + code（各自独立 Form.Item）
              <Form
                form={codeForm}
                onFinish={handleCodeLogin}
                layout="vertical"
                style={{ marginTop: 8 }}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: t('auth.pleaseEnterEmail') },
                    { type: 'email', message: t('auth.validEmail') },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder={t('auth.pleaseEnterEmail')}
                    size="large"
                    autoComplete="email"
                  />
                </Form.Item>

                {/* 验证码行：Input + 发送按钮，两个独立元素用 flex 排列 */}
                <Form.Item
                  name="code"
                  rules={[
                    { required: true, message: t('auth.pleaseEnterCode') },
                  ]}
                >
                  <Input
                    prefix={<SafetyOutlined />}
                    placeholder={t('auth.pleaseEnterCode')}
                    size="large"
                    suffix={
                      <Button
                        type="link"
                        size="small"
                        disabled={countdown > 0}
                        onClick={sendVerificationCode}
                        style={{
                          padding: '0 4px',
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {countdown > 0 ? `${countdown}s` : t('auth.getCode')}
                      </Button>
                    }
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 12 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                  >
                    {t('auth.submitLogin')}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ color: '#888', fontSize: 13 }}>
                    {t('auth.noAccountYet')}
                  </span>
                  <Button
                    type="link"
                    onClick={handleGoToRegister}
                    style={{ fontSize: 13 }}
                  >
                    {t('auth.registerNow')}
                  </Button>
                </div>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default LoginModal;
