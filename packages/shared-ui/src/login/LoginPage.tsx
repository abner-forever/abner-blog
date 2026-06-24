import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import AnimatedCharacters from "../animated-characters/AnimatedCharacters";
import "./style.less";

/* ─── Types ──────────────────────────────────────────────────────────── */

export interface BrandConfig {
  /** Brand display name (e.g., "Abner Editor") */
  name: string;
  /** Brand icon/logo as a ReactNode (typically an <svg>) */
  logo: React.ReactNode;
  /** Optional override for the mobile header logo */
  mobileLogo?: React.ReactNode;
}

export interface LoginTexts {
  title: string;
  subtitle: string;
  tagline: string;
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  loginButton: string;
  ssoDivider: string;
  ssoLogin: string;
  loginSuccess?: string;
}

export interface SSOUser {
  userId: number;
  username: string;
  role: "admin" | "user";
  email?: string;
}

export interface LoginPageProps {
  /** Brand configuration */
  brand: BrandConfig;
  /** All user-visible text (supports both i18n and hardcoded strings) */
  texts: LoginTexts;
  /** Login handler — receives form values, should throw on error */
  onLogin: (values: { username: string; password: string }) => Promise<void>;
  /** SSO login redirect handler */
  onSSOLogin: () => void;
  /** Optional SSO auto-login check on mount. Return user data if authenticated */
  onSSOCheck?: () => Promise<SSOUser | null>;
  /** Required if onSSOCheck is set — handles auth dispatch & navigation for SSO auto-login */
  onSSOAutoLogin?: (user: SSOUser) => void;
  /** Default redirect path after successful login (default: "/") */
  defaultRedirect?: string;
}

/* ─── Component ──────────────────────────────────────────────────────── */

const LoginPage: React.FC<LoginPageProps> = ({
  brand,
  texts,
  onLogin,
  onSSOLogin,
  onSSOCheck,
  onSSOAutoLogin,
  defaultRedirect = "/",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  /* form state */
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);
  const [form] = Form.useForm();

  /* SSO check on mount */
  useEffect(() => {
    if (!onSSOCheck || !onSSOAutoLogin) return;
    let cancelled = false;

    onSSOCheck()
      .then((user) => {
        if (user && !cancelled) {
          onSSOAutoLogin(user);
          message.success(texts.loginSuccess || "登录成功");
          const from = (location.state as { from?: string })?.from || defaultRedirect;
          navigate(from, { replace: true });
        }
      })
      .catch(() => {
        // SSO 未登录
      });

    return () => {
      cancelled = true;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* JWT login */
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await onLogin(values);
      message.success(texts.loginSuccess || "登录成功");
      const from = (location.state as { from?: string })?.from || defaultRedirect;
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = axiosError.response?.data?.message || axiosError.message || "登录失败";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* Track username focus for character animation */
  const handleUsernameFocus = () => setIsTyping(true);
  const handleUsernameBlur = () => setIsTyping(false);

  /* Track password for character animation */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordLength(e.target.value.length);
  };

  return (
    <div className="al-page">
      {/* ===== LEFT PANEL ===== */}
      <div className="al-left">
        <div className="al-left__bg" />
        <div className="al-left__glow-1" />
        <div className="al-left__glow-2" />
        <div className="al-left__grid" />

        {/* Animated blob characters */}
        <AnimatedCharacters
          isTyping={isTyping}
          showPassword={showPassword}
          passwordLength={passwordLength}
        />

        {/* Brand */}
        <div className="al-left__brand">
          <div className="al-left__brand-icon">
            {brand.logo}
          </div>
          <span className="al-left__brand-name">{brand.name}</span>
        </div>

        {/* Footer */}
        <div className="al-left__footer">
          <a href="#" className="al-left__footer-link">帮助中心</a>
          <span className="al-left__footer-dot">·</span>
          <a href="#" className="al-left__footer-link">隐私政策</a>
          <span className="al-left__footer-dot">·</span>
          <a href="#" className="al-left__footer-link">服务条款</a>
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="al-right">
        <div className="al-right__wrapper">
          {/* Mobile brand */}
          <div className="al-right__mobile-brand">
            {brand.mobileLogo || brand.logo}
            <span className="al-right__mobile-brand-text">{brand.name}</span>
          </div>

          {/* Header */}
          <div className="al-right__header">
            <h2 className="al-right__title">{texts.title}</h2>
            <p className="al-right__subtitle">{texts.subtitle}</p>
            <p className="al-right__tagline">{texts.tagline}</p>
          </div>

          {/* JWT Login Form */}
          <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large" className="al-form">
            <Form.Item
              name="username"
              label={<span className="al-form__label">{texts.username}</span>}
              rules={[{ required: true, message: texts.usernamePlaceholder }]}
            >
              <Input
                prefix={<UserOutlined className="al-form__prefix-icon" />}
                placeholder={texts.usernamePlaceholder}
                className="al-form__input"
                onFocus={handleUsernameFocus}
                onBlur={handleUsernameBlur}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="al-form__label">{texts.password}</span>}
              rules={[{ required: true, message: texts.passwordPlaceholder }]}
            >
              <Input
                type={showPassword ? "text" : "password"}
                prefix={<LockOutlined className="al-form__prefix-icon" />}
                placeholder={texts.passwordPlaceholder}
                className="al-form__input"
                onChange={handlePasswordChange}
                suffix={
                  <span
                    className="al-form__eye"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </span>
                }
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" loading={loading} block className="al-form__submit">
                {texts.loginButton}
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div className="al-divider">
            <span className="al-divider__text">{texts.ssoDivider}</span>
          </div>

          {/* SSO button */}
          <Button
            icon={<KeyOutlined />}
            block
            size="large"
            className="al-sso-btn"
            onClick={onSSOLogin}
          >
            {texts.ssoLogin}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
