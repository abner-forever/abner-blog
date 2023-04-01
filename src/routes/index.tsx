import React, { Suspense, useState } from "react";
import {
  BrowserRouter as Router, Route, Routes, useRoutes, useLocation,Outlet
} from "react-router-dom";
import routerConfig from "./routers";
import { Footer, LoginModal, Header } from "@/components";
// import AuthToken from "./authTokenRouter";
 
import HomePage from '../page/homePage'
import Demo from '../page/demo'
import "@/index.scss";

const App = () => {
  const { pathname} = useLocation()
  console.log('pathname',pathname);
  
  let routes = useRoutes(routerConfig,pathname);
  return routes;
};

const Routers = () => {

  const [isLoginModalShow, setIsModalShow] = useState(false);
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }
  return (
    <Suspense>
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
    </Suspense>
  );
};

export default Routers;

