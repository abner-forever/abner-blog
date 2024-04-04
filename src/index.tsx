import ReactDOM from "react-dom/client";
import "antd/dist/reset.css";
import "./lib/flex";
import React, { Component } from "react";
import { ConfigProvider } from "antd";
import { Provider } from "mobx-react";
import AppRouter from "./routes";
import store from "./store";
import setRem from "./utils/setRem";

const antdTheme = {
  token: {
    "colorPrimary": "#009a61",
    "colorInfo": "#009a61",
    "fontSize": 16,
    "borderRadius": 8
  },
};
setRem();
class App extends Component {
  render() {
    return (
      <ConfigProvider theme={antdTheme}>
        <Provider {...store}>
          <AppRouter />
        </Provider>
      </ConfigProvider>
    );
  }
}

const rootEl = document.getElementById("root");

if (rootEl) {
  rootEl.classList.remove("root-loading");
  ReactDOM.createRoot(rootEl).render(<App />);
}
