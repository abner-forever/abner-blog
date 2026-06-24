import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LoginPage } from "@abner-blog/shared-ui";
import type { LoginPageProps, SSOUser } from "@abner-blog/shared-ui";
import { httpMutator } from "@/services/http";
import { getSSOStatus, parseSSOUser } from "@/services/sso";
import { setSSOCredentials, setCredentials } from "@/store/authSlice";

const brandLogo = (
  <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
    <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 16l6 6 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const mobileLogo = (
  <svg viewBox="0 0 32 32" fill="none" width="22" height="22" style={{ color: "#2f81f7" }}>
    <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 16l6 6 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogin: LoginPageProps["onLogin"] = async (values) => {
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
  };

  const handleSSOLogin = () => {
    window.location.href =
      "/api/sso/authorize?redirectTo=" + encodeURIComponent(window.location.origin);
  };

  const handleSSOCheck = async (): Promise<SSOUser | null> => {
    const status = await getSSOStatus();
    return parseSSOUser(status);
  };

  const handleSSOAutoLogin = (user: SSOUser) => {
    dispatch(setSSOCredentials(user));
  };

  return (
    <LoginPage
      brand={{
        name: "Abner Editor",
        logo: brandLogo,
        mobileLogo,
      }}
      texts={{
        title: "欢迎回来",
        subtitle: "请登录以继续使用编辑器",
        tagline: "低代码拖拽式 · 页面搭建平台",
        username: "用户名",
        usernamePlaceholder: "请输入用户名",
        password: "密码",
        passwordPlaceholder: "请输入密码",
        loginButton: "登录",
        ssoDivider: "或使用 SSO 单点登录",
        ssoLogin: "使用 SSO 单点登录",
        loginSuccess: "登录成功",
      }}
      onLogin={handleLogin}
      onSSOLogin={handleSSOLogin}
      onSSOCheck={handleSSOCheck}
      onSSOAutoLogin={handleSSOAutoLogin}
      defaultRedirect="/"
    />
  );
};

export default Login;
