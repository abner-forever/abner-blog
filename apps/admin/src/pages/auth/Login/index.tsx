import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { getBlogAdminAPI } from "@/services/generated/admin";
import { setCredentials, setSSOCredentials } from "@/store/authSlice";
import { getSSOStatus } from "@/services/sso";
import AnimatedCharacters from "@/components/AnimatedCharacters";
import "./index.less";

const api = getBlogAdminAPI();

/* ─── Main Component ───────────────────────────────────────────────────── */

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  /* form state */
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);
  const [form] = Form.useForm();

  /* SSO check on mount */
  useEffect(() => {
    getSSOStatus()
      .then((status) => {
        if (status.authenticated && status.userId && status.username && status.role) {
          dispatch(
            setSSOCredentials({
              userId: status.userId,
              username: status.username,
              role: status.role as "admin" | "user",
              email: status.email,
            }),
          );
          message.success(t("login.loginSuccess"));
          navigate("/dashboard");
        }
      })
      .catch(() => { /* SSO not logged in */ });
  }, [dispatch, navigate, t]);

  /* JWT login */
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.adminLogin(values);
      const result = response as unknown as
        | { token?: string; user?: { userId?: number; username?: string; role?: string } }
        | undefined;

      if (result?.token) {
        dispatch(
          setCredentials({
            token: result.token,
            user: {
              userId: result.user?.userId || 1,
              username: result.user?.username || values.username,
              role: (result.user?.role || "admin") as "admin" | "user",
            },
          }),
        );
        message.success(t("login.loginSuccess"));
        navigate("/dashboard");
      } else {
        message.error(t("login.noToken"));
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = axiosError.response?.data?.message || axiosError.message || t("login.loginFail");
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    window.location.href = "/api/sso/authorize";
  };

  /* Character animation event handlers */
  const handleUsernameFocus = () => setIsTyping(true);
  const handleUsernameBlur = () => setIsTyping(false);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordLength(e.target.value.length);
  };

  return (
    <div className="al-page">
      {/* ===== LEFT PANEL ===== */}
      <div className="al-left">
        {/* Gradients */}
        <div className="al-left__bg" />
        <div className="al-left__glow-1" />
        <div className="al-left__glow-2" />

        {/* Grid overlay */}
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
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="al-left__brand-name">Abner Admin</span>
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
            <svg viewBox="0 0 32 32" fill="none" width="22" height="22" style={{ color: "#1890ff" }}>
              <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="al-right__mobile-brand-text">Abner Admin</span>
          </div>

          {/* Header */}
          <div className="al-right__header">
            <h2 className="al-right__title">{t("login.title")}</h2>
            <p className="al-right__subtitle">{t("login.subtitle")}</p>
            <p className="al-right__tagline">统一接入平台 · 旗下所有系统</p>
          </div>

          {/* JWT Form */}
          <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large" className="al-form">
            <Form.Item
              name="username"
              label={<span className="al-form__label">{t("login.username")}</span>}
              rules={[{ required: true, message: t("login.username") }]}
            >
              <Input
                prefix={<UserOutlined className="al-form__prefix-icon" />}
                placeholder={t("login.usernamePlaceholder")}
                className="al-form__input"
                onFocus={handleUsernameFocus}
                onBlur={handleUsernameBlur}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="al-form__label">{t("login.password")}</span>}
              rules={[{ required: true, message: t("login.password") }]}
            >
              <Input
                type={showPassword ? "text" : "password"}
                prefix={<LockOutlined className="al-form__prefix-icon" />}
                placeholder={t("login.passwordPlaceholder")}
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
                {t("login.loginButton")}
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div className="al-divider">
            <span className="al-divider__text">{t("login.ssoDivider")}</span>
          </div>

          {/* SSO button */}
          <Button
            icon={<KeyOutlined />}
            block
            size="large"
            className="al-sso-btn"
            onClick={handleSSOLogin}
          >
            {t("login.ssoLogin")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
