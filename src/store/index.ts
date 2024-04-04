import ArticlStore from "./articleStore";
import GlobalStore from "./globalStore";
import React from "react";

const stores = React.createContext({
  article: new ArticlStore(),
  global: new GlobalStore(),
});

export default stores;
