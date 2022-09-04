import React, { Suspense, useState } from "react";
import {
  BrowserRouter as Router,
} from "react-router-dom";
import routerConfig from "./routers";
import "@/index.scss";
import { Footer, LoginModal, Header } from "@/components";
import AuthToken from "./authTokenRouter";

const Routers = () => {
  const [isLoginModalShow, setIsModalShow] = useState(false);
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }

  return (
    <Suspense>
      <Router>
        <Header
          onToggleLoginModal={onToggleLoginModal}
          routerConfig={routerConfig}
        />

        <AuthToken />
        <Footer />
      </Router>
      {
        isLoginModalShow && <LoginModal onClose={onToggleLoginModal} />
      }
    </Suspense>
  );
};


export default Routers;

