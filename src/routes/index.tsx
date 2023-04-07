import React, { Suspense, useState } from "react";
import { BrowserRouter, useRoutes, useLocation } from "react-router-dom";
import { Footer, LoginModal, Header, Loading } from "@/components";
import routerConfig from "./routers";

import "@/index.less";

const App = () => {
  const { pathname } = useLocation()
  let routes = useRoutes(routerConfig, pathname);
  return routes;
};

const Routers = () => {

  const [isLoginModalShow, setIsModalShow] = useState(false);
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }
  
  return (
    <Suspense fallback={<Loading />}>
      <BrowserRouter>
        <Header
          onToggleLoginModal={onToggleLoginModal}
          routerConfig={routerConfig}
        />
        <div className="content-wrap">
          <div className="content">
            <App />
          </div>
        </div>
        <Footer />
        {
          isLoginModalShow && <LoginModal onClose={onToggleLoginModal} />
        }
      </BrowserRouter>
    </Suspense>
  );
};

export default Routers;

