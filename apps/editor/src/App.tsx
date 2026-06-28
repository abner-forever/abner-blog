import { useEffect, useRef, useState } from "react";
import { useRoutes, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ConfigProvider, Spin } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import type { RootState } from "./store";
import { setSSOCredentials } from "./store/authSlice";
import { getSSOStatus, parseSSOUser } from "./services/sso";
import Login from "./pages/Login";
import HomeDashboard from "./pages/HomeDashboard";
import PageList from "./pages/PageList";
import PageEditor from "./pages/PageEditor";
import PagePreview from "./pages/PagePreview";
import TrashList from "./pages/TrashList";
import ReviewList from "./pages/ReviewList";
import VersionList from "./pages/VersionList";
import AiPageGenerator from "./pages/AiPageGenerator";
import AppLayout from "./components/AppLayout";

function App() {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const currentLocale = useSelector((state: RootState) => state.locale.locale);
  const dispatch = useDispatch();
  const location = useLocation();

  // 刷新时 authSlice 已从 localStorage 恢复 JWT token，
  // 只需要在无 JWT 时才查询 SSO 状态
  const [initializing, setInitializing] = useState(token === null);
  const ssoCheckCalled = useRef(false);

  useEffect(() => {
    // 已有 token + user，无需初始化
    if (token !== null && user !== null) {
      setInitializing(false);
      return;
    }
    // 防止 StrictMode 下重复调用
    if (ssoCheckCalled.current) return;
    ssoCheckCalled.current = true;

    getSSOStatus()
      .then((status) => {
        const ssoUser = parseSSOUser(status);
        if (ssoUser) {
          dispatch(setSSOCredentials(ssoUser));
        }
      })
      .catch(() => {
        // SSO 未登录，留在登录页
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [dispatch, token, user]); // token/user 变化自动跳过 SSO 检查

  // 动态设置浏览器标题
  useEffect(() => {
    const path = location.pathname;
    const baseTitle = '龙码 - 低代码平台';

    const exactTitles: Record<string, string> = {
      '/login': '登录',
      '/': '首页',
      '/pages': '页面列表',
      '/trash': '回收站',
      '/review': '审核列表',
      '/editor/ai-create': 'AI 页面生成',
    };

    const prefixTitles: [string, string][] = [
      ['/editor/', '页面编辑器'],
      ['/versions/', '版本历史'],
      ['/page/', '页面预览'],
    ];

    const pageTitle = exactTitles[path] ?? prefixTitles.find(([p]) => path.startsWith(p))?.[1] ?? '';

    document.title = pageTitle ? `${pageTitle} - ${baseTitle}` : baseTitle;
  }, [location.pathname]);

  // 必须在条件返回之前调用所有 hooks
  const routes = useRoutes([
    {
      path: "/login",
      element: token ? <Navigate to="/" replace /> : <Login />,
    },
    {
      // 需要认证的页面，包裹在 AppLayout（侧边栏）中
      element: token ? <AppLayout /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
      children: [
        { index: true, element: <HomeDashboard /> },
        { path: "pages", element: <PageList /> },
        { path: "trash", element: <TrashList /> },
        { path: "review", element: <ReviewList /> },
      ],
    },
    {
      path: "/editor/:slug",
      element: token ? <PageEditor /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/editor/ai-create",
      element: token ? <AiPageGenerator /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/versions/:slug",
      element: token ? <VersionList /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/page/:slug",
      element: <PagePreview />,
    },
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ]);

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

  return (
    <ConfigProvider locale={currentLocale === "zh-CN" ? zhCN : enUS}>
      {routes}
    </ConfigProvider>
  );
}

export default App;
