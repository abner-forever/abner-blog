import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Link,
} from "react-router-dom";
import routerConfig from "./routers";
import "@/index.scss";
import { Footer, LoginModal, Header } from "@/components";
import Cookies from "js-cookie";
import AuthToken from "./authTokenRouter";

const Routers = ({ globalStore }: any) => {
  const [isLoginModalShow, setIsModalShow] = useState(false);
  const token = Cookies.get("token");
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }
  console.log('globalStore', globalStore);

  return (
    <>
      <Router>
        <Header
          onToggleLoginModal={onToggleLoginModal}
          routerConfig={routerConfig}
        />
        <AuthToken
          token={token}
        />
      </Router>
      <Footer />
      {
        isLoginModalShow && <LoginModal onClose={onToggleLoginModal} />
      }
    </>
  );
};


export default Routers;

