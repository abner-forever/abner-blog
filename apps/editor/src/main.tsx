import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import App from "./App";
import { store } from "./store";
import type { RootState } from "./store";
import "./styles/global.less";

/** 在 React 渲染前设置初始 data-theme，避免闪烁 */
const initialTheme = (() => {
  const saved = localStorage.getItem("editor-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
})();
document.documentElement.setAttribute("data-theme", initialTheme);
document.documentElement.setAttribute("lang", "zh-CN");

/** antd 语言映射 */
const antdLocaleMap: Record<string, typeof zhCN> = {
  "zh-CN": zhCN,
  en: enUS,
};

/** 包裹 ConfigProvider，使 theme + locale 可以从 Redux 动态切换 */
const ThemedApp = () => {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const appLocale = useSelector((state: RootState) => state.locale.locale);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", appLocale);
  }, [appLocale]);

  return (
    <ConfigProvider
      locale={antdLocaleMap[appLocale] || zhCN}
      theme={{
        algorithm: themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#2f81f7",
          borderRadius: 10,
          colorBgContainer: themeMode === "dark" ? "#1a1c2a" : "#ffffff",
          colorBgElevated: themeMode === "dark" ? "#1e2030" : "#ffffff",
          colorBorder: themeMode === "dark" ? "#2a2c3e" : "#e5e7eb",
        },
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  </React.StrictMode>,
);
