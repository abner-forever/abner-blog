import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import { Provider } from "mobx-react";
import AppRouter from "./routes";
import store from "./store";
import "./lib/setRem";
import "antd/dist/reset.css";

const antdTheme = {
  token: {
    colorPrimary: "#009a61",
    colorInfo: "#009a61",
    fontSize: 16,
    borderRadius: 8,
  },
};


const App = () => {
  return (
    <ConfigProvider theme={antdTheme}>
      <Provider {...store}>
        <AppRouter />
      </Provider>
    </ConfigProvider>
  );
};

const rootEl = document.getElementById("root");
if (rootEl) {
  rootEl.classList.remove("root-loading");
  ReactDOM.createRoot(rootEl).render(<App />);
}
