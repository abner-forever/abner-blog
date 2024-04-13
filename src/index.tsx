import React from "react";
import ReactDOM from "react-dom/client";
// import { ConfigProvider } from "antd-mobile";
import { Provider } from "mobx-react";
import AppRouter from "./routes";
import store from "./store";
import "./lib/setRem";

const App = () => {
  return (
      <Provider {...store}>
        <AppRouter />
      </Provider>
  );
};

const rootEl = document.getElementById("root");
if (rootEl) {
  rootEl.attributes.removeNamedItem("class")
  ReactDOM.createRoot(rootEl).render(<App />);
}
