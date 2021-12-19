import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Link,
} from "react-router-dom";
import routerConfig from "./routers";
import "@/index.scss";
import { Footer, LoginModal } from "@/components";
import Cookies from "js-cookie";

import AuthToken from "./authTokenRouter";
const Routers = () => {
  const [isLoginModalShow, setIsModalShow] = useState(false);
  let token = Cookies.get("token");
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }
  return (
    <>
      <Router>
        <header className="header-container">
          <ul className="banner">
            <div className='banner-left'>
              <Link to="/" className='banner-logo'>Abner的笔记</Link>
              {routerConfig.map(
                (item: any, index) =>
                  item.isShowHeader && (
                    <li
                      key={index}
                      className={item.current ? "active-tab" : "tab-item"}
                    >
                      <Link to={item.path}>{item.title}</Link>
                    </li>
                  )
              )}
            </div>
            <li className="tab-item">
              {!token ? (
                <a onClick={onToggleLoginModal}>登录</a>
              ) : (
                <Link to='/mine'>
                  <img className="user-icon" src={Cookies.get("avator")} alt="" />
                </Link>
              )}
            </li>
          </ul>
        </header>
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