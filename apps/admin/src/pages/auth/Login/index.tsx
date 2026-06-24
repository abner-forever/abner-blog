import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { message } from "antd";
import { useTranslation } from "react-i18next";
import { LoginPage } from "@abner-blog/shared-ui";
import type { LoginPageProps, SSOUser } from "@abner-blog/shared-ui";
import { getBlogAdminAPI } from "@/services/generated/admin";
import { setCredentials, setSSOCredentials } from "@/store/authSlice";
import { getSSOStatus } from "@/services/sso";
import "./index.less";

const api = getBlogAdminAPI();

const brandLogo = (
  <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
    <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const mobileLogo = (
  <svg viewBox="0 0 32 32" fill="none" width="22" height="22" style={{ color: "#1890ff" }}>
    <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M10 22V10h4l4 8 4-8h4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleLogin: LoginPageProps["onLogin"] = async (values) => {
    const response = await api.adminLogin(values);
    const result = response as unknown as
      | { token?: string; user?: { userId?: number; username?: string; role?: string } }
      | undefined;

    if (!result?.token) {
      throw new Error(t("login.noToken"));
    }

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
  };

  const handleSSOLogin = () => {
    window.location.href = "/api/sso/authorize";
  };

  const handleSSOCheck = async (): Promise<SSOUser | null> => {
    const status = await getSSOStatus();
    if (status.authenticated && status.userId && status.username && status.role) {
      return {
        userId: status.userId,
        username: status.username,
        role: status.role as "admin" | "user",
        email: status.email,
      };
    }
    return null;
  };

  const handleSSOAutoLogin = (user: SSOUser) => {
    dispatch(setSSOCredentials(user));
    message.success(t("login.loginSuccess"));
    navigate("/dashboard");
  };

  return (
    <LoginPage
      brand={{
        name: "Abner Admin",
        logo: brandLogo,
        mobileLogo,
      }}
      texts={{
        title: t("login.title"),
        subtitle: t("login.subtitle"),
        tagline: "统一接入平台 · 旗下所有系统",
        username: t("login.username"),
        usernamePlaceholder: t("login.usernamePlaceholder"),
        password: t("login.password"),
        passwordPlaceholder: t("login.passwordPlaceholder"),
        loginButton: t("login.loginButton"),
        ssoDivider: t("login.ssoDivider"),
        ssoLogin: t("login.ssoLogin"),
        loginSuccess: t("login.loginSuccess"),
      }}
      onLogin={handleLogin}
      onSSOLogin={handleSSOLogin}
      onSSOCheck={handleSSOCheck}
      onSSOAutoLogin={handleSSOAutoLogin}
      defaultRedirect="/dashboard"
    />
  );
};

export default Login;
