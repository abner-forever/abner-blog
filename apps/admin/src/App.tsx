import { useEffect, useRef, useState } from "react";
import { useRoutes, Navigate } from "react-router-dom";
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

  return <GlobalWrapper>{routes}</GlobalWrapper>;
}

export default App;
