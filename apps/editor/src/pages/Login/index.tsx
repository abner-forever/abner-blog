import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Form, Input, Button, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { httpMutator } from "@/services/http";
import { getSSOStatus, parseSSOUser } from "@/services/sso";
import { setSSOCredentials, setCredentials } from "@/store/authSlice";
import AnimatedCharacters from "@/components/AnimatedCharacters";
import "./index.less";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

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
        const user = parseSSOUser(status);
        if (user) {
          dispatch(setSSOCredentials(user));
          message.success("登录成功");
          const from = (location.state as { from?: string })?.from || "/";
          navigate(from, { replace: true });
        }
      })
      .catch(() => {
        // SSO 未登录
      });
  }, [dispatch, navigate, location.state]);

  /* JWT login */
  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await httpMutator<{
        token: string;
        user?: { userId?: number; username?: string; role?: string };
      }>({
        url: "/api/admin/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: values,
      });

      dispatch(
        setCredentials({
          token: result.token,
          user: {
            userId: result.user?.userId || 1,
            username: result.user?.username || values.username,
            role: (result.user?.role || "admin") as "admin" | "user",
            email: undefined,
          },
        }),
      );
      message.success("登录成功");
      const from = (location.state as { from?: string })?.from || "/";
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg = axiosError.response?.data?.message || axiosError.message || "登录失败";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    window.location.href =
      "/api/sso/authorize?redirectTo=" + encodeURIComponent(window.location.origin);
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
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 16l6 6 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="al-left__brand-name">Abner Editor</span>
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
              <path d="M8 16l6 6 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="al-right__mobile-brand-text">Abner Editor</span>
          </div>

          {/* Header */}
          <div className="al-right__header">
            <h2 className="al-right__title">欢迎回来</h2>
            <p className="al-right__subtitle">请登录以继续使用编辑器</p>
            <p className="al-right__tagline">低代码拖拽式 · 页面搭建平台</p>
          </div>

          {/* JWT Login Form */}
          <Form form={form} name="login" onFinish={onFinish} layout="vertical" size="large" className="al-form">
            <Form.Item
              name="username"
              label={<span className="al-form__label">用户名</span>}
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input
                prefix={<UserOutlined className="al-form__prefix-icon" />}
                placeholder="请输入用户名"
                className="al-form__input"
                onFocus={handleUsernameFocus}
                onBlur={handleUsernameBlur}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="al-form__label">密码</span>}
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input
                type={showPassword ? "text" : "password"}
                prefix={<LockOutlined className="al-form__prefix-icon" />}
                placeholder="请输入密码"
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
                登录
              </Button>
            </Form.Item>
          </Form>

          {/* Divider */}
          <div className="al-divider">
            <span className="al-divider__text">或使用 SSO 单点登录</span>
          </div>

          {/* SSO button */}
          <Button
            icon={<KeyOutlined />}
            block
            size="large"
            className="al-sso-btn"
            onClick={handleSSOLogin}
          >
            使用 SSO 单点登录
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
