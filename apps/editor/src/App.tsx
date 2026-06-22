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
import PageList from "./pages/PageList";
import PageEditor from "./pages/PageEditor";
import PagePreview from "./pages/PagePreview";
import TrashList from "./pages/TrashList";
import ReviewList from "./pages/ReviewList";
import VersionList from "./pages/VersionList";

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

  // 必须在条件返回之前调用所有 hooks
  const routes = useRoutes([
    {
      path: "/login",
      element: token ? <Navigate to="/" replace /> : <Login />,
    },
    {
      path: "/",
      element: token ? <PageList /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/editor/:id",
      element: token ? <PageEditor /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/trash",
      element: token ? <TrashList /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/review",
      element: token ? <ReviewList /> : <Navigate to="/login" replace state={{ from: location.pathname }} />,
    },
    {
      path: "/versions/:pageId",
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
