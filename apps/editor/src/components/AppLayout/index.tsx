import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Avatar, Dropdown, Space, message } from "antd";
import {
  HomeOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  BlockOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  CheckOutlined,
  GlobalOutlined,
  LogoutOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import type { RootState } from "@/store";
import { toggleTheme } from "@/store/themeSlice";
import { setLocale } from "@/store/localeSlice";
import { logout } from "@/store/authSlice";
import { ssoLogout } from "@/services/sso";
import "./index.less";

export interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const menuItems: NavItem[] = [
  { key: "/", icon: <HomeOutlined />, label: "首页" },
  { key: "/pages", icon: <FileTextOutlined />, label: "页面管理" },
  {
    key: "/editor/ai-create",
    icon: <RobotOutlined />,
    label: "AI 生成",
  },
  { key: "/templates", icon: <AppstoreOutlined />, label: "模板管理", disabled: true },
  { key: "/components", icon: <BlockOutlined />, label: "自定义组件", disabled: true },
];

const localeAbbr: Record<string, string> = {
  "zh-CN": "中",
  en: "EN",
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const { user, token } = useSelector((state: RootState) => state.auth);
  const currentLocale = useSelector((state: RootState) => state.locale.locale);
  const dispatch = useDispatch();

  const activeKey = menuItems
    .filter((item) => !item.disabled)
    .find((item) => {
      if (item.key === "/") return location.pathname === "/";
      return location.pathname.startsWith(item.key);
    })?.key;

  const handleLogout = async () => {
    const isJWT = token && token !== "sso-session";

    if (isJWT) {
      dispatch(logout());
      navigate("/login", { replace: true });
      return;
    }

    try {
      const result = await ssoLogout();
      dispatch(logout());
      if (result.redirectUrl) {
        const url = new URL(result.redirectUrl);
        url.searchParams.set(
          "post_logout_redirect_uri",
          window.location.origin + "/login",
        );
        window.location.href = url.toString();
        return;
      }
    } catch {
      dispatch(logout());
    }
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="app-layout__sidebar">
        {/* Brand */}
        <div className="app-layout__brand">
          <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
            <rect x="2" y="2" width="28" height="28" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M8 16l6 6 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="app-layout__brand-text">Abner Editor</span>
        </div>

        {/* Navigation */}
        <nav className="app-layout__nav">
          {menuItems.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                className={`app-layout__nav-item${isActive ? " app-layout__nav-item--active" : ""}${item.disabled ? " app-layout__nav-item--disabled" : ""}`}
                onClick={() => {
                  if (!item.disabled) navigate(item.key);
                }}
                disabled={item.disabled}
                title={item.disabled ? "即将上线" : item.label}
              >
                <span className="app-layout__nav-icon">{item.icon}</span>
                <span className="app-layout__nav-label">{item.label}</span>
                {item.disabled && (
                  <span className="app-layout__nav-badge">即将上线</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User area */}
        <div className="app-layout__user">
          <Dropdown
            menu={{
              items: [
                {
                  key: "theme",
                  icon: themeMode === "dark" ? <SunOutlined /> : <MoonOutlined />,
                  label: themeMode === "dark" ? "浅色模式" : "深色模式",
                  onClick: () => dispatch(toggleTheme()),
                },
                { type: "divider" },
                {
                  key: "lang-label",
                  label: (
                    <Space size={6}>
                      <GlobalOutlined />
                      <span>语言 / Language</span>
                    </Space>
                  ),
                  disabled: true,
                  style: { cursor: "default", opacity: 0.65, fontSize: 12 },
                },
                {
                  key: "zh-CN",
                  icon: currentLocale === "zh-CN" ? <CheckOutlined /> : <span style={{ display: "inline-block", width: 14 }} />,
                  label: "简体中文",
                  onClick: () => dispatch(setLocale("zh-CN")),
                  className: currentLocale === "zh-CN" ? "app-layout__locale-active" : "",
                },
                {
                  key: "en",
                  icon: currentLocale === "en" ? <CheckOutlined /> : <span style={{ display: "inline-block", width: 14 }} />,
                  label: "English",
                  onClick: () => dispatch(setLocale("en")),
                  className: currentLocale === "en" ? "app-layout__locale-active" : "",
                },
                { type: "divider" },
                {
                  key: "logout",
                  icon: <LogoutOutlined />,
                  label: "退出登录",
                  onClick: handleLogout,
                  danger: true,
                },
              ],
            }}
            placement="topLeft"
            trigger={["click"]}
          >
            <button className="app-layout__user-btn">
              <Avatar
                size={28}
                style={{ backgroundColor: "#2f81f7", flexShrink: 0 }}
              >
                {user?.username?.charAt(0).toUpperCase() ?? "U"}
              </Avatar>
              <span className="app-layout__user-name">
                {user?.username ?? "用户"}
              </span>
              <SettingOutlined className="app-layout__user-settings" />
            </button>
          </Dropdown>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
