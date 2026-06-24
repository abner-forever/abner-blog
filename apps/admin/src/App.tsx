import { useEffect, useRef, useState } from "react";
import { useRoutes, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Spin } from "antd";
import type { RootState } from "./store";
import { setSSOCredentials } from "./store/authSlice";
import { getSSOStatus } from "./services/sso";
import AdminLayout from "./components/AdminLayout";
import GlobalWrapper from "./components/GlobalWrapper";
import { authRoutes, adminLayoutChildren } from "./routes";

function App() {
  const { token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const ssoChecked = useRef(false);
  const [initializing, setInitializing] = useState(
    !token && !localStorage.getItem("admin-token"),
  );

  useEffect(() => {
    // 如果没有 JWT token，检查是否存在 SSO 会话
    if (!token && !ssoChecked.current) {
      ssoChecked.current = true;
      getSSOStatus()
        .then((status) => {
          if (
            status.authenticated &&
            status.userId &&
            status.username &&
            status.role
          ) {
            dispatch(
              setSSOCredentials({
                userId: status.userId,
                username: status.username,
                role: status.role as "admin" | "user",
                email: status.email,
              }),
            );
          }
        })
        .catch(() => {
          // SSO 未登录，忽略
        })
        .finally(() => {
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }
  }, [token, dispatch]);

  // 动态设置浏览器标题
  useEffect(() => {
    const path = location.pathname;
    const baseTitle = '龙码 - 管理后台';

    const exactTitles: Record<string, string> = {
      '/login': '登录',
      '/': '仪表盘',
      '/dashboard': '仪表盘',
      '/blogs': '博客管理',
      '/comments': '评论管理',
      '/moments': '动态管理',
      '/users': '用户管理',
      '/system-announcements': '系统公告',
      '/analytics/users': '用户分析',
      '/analytics/dashboard': '分析仪表盘',
      '/analytics/events': '事件追踪',
      '/analytics/performance': '性能分析',
    };

    const prefixTitles: [string, string][] = [
      ['/blogs/', '博客编辑'],
      ['/moments/', '动态管理'],
      ['/users/', '用户详情'],
      ['/analytics/users/', '用户详情'],
    ];

    const pageTitle = exactTitles[path] ?? prefixTitles.find(([p]) => path.startsWith(p))?.[1] ?? '';

    document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
  }, [location.pathname]);

  const routes = useRoutes([
    {
      path: "/login",
      element: token ? (
        <Navigate to="/dashboard" replace />
      ) : (
        authRoutes[0].element
      ),
    },
    {
      path: "/",
      element: token ? <AdminLayout /> : <Navigate to="/login" replace />,
      children: adminLayoutChildren,
    },
    {
      path: "*",
      element: <Navigate to="/dashboard" replace />,
    },
  ]);

  // 初始化时显示加载，避免 SSO 检查完成前闪烁登录页
  if (initializing) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return <GlobalWrapper>{routes}</GlobalWrapper>;
}

export default App;
