import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import { store } from "./store";
import "./i18n";
import "./styles/global.less";
import { initAnalytics, setUserId, clearUser } from "@abner/analytics";

const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

// 初始化 analytics SDK
initAnalytics({
  appId: 'abner-blog-admin',
  serverUrl: '',
  sampleRate: 0.15,
  autoTrack: true,
  debug: false,
  getToken: () => localStorage.getItem('admin-token'),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={routerFutureFlags}>
        <ConfigProvider
          locale={zhCN}
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: "#1890ff",
              borderRadius: 8,
            },
          }}
        >
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);

// 监听登录状态变化，同步 userId
let lastToken: string | null = null;
store.subscribe(() => {
  const state = store.getState();
  const currentToken = state.auth?.token;

  if (currentToken && currentToken !== lastToken) {
    lastToken = currentToken;
    const userId = state.auth?.user?.id;
    if (userId) {
      setUserId(userId);
    }
  } else if (!currentToken && lastToken !== null) {
    lastToken = null;
    clearUser();
  }
});
