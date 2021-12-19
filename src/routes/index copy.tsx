import React, { Suspense, useState } from "react";
import {
  BrowserRouter as Router,
  Link,
  withRouter,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import routerConfig from "./routers";
import "@/index.scss";
import { Loading, PageNotFound, Footer, LoginModal } from "@/components";
import Cookies from "js-cookie";
import { commonStore } from "@/utils/store";
import { Modal } from 'antd';
const Routers = () => {
  let token = Cookies.get("token");
  return (
    <Router>
      <AuthToken
        token={token}
      />
    </Router>
  );
};

const AuthToken = withRouter(({ token }: any) => {
  const path = window.location.pathname;
  const [isLoginModalShow, setIsModalShow] = useState(false);
  routerConfig.forEach((item: any, index) => {
    if (path === item.path) {
      if (item.isShowHeader) {
        item.current = true;
      } else {
      }
    } else {
      item.current = false;
      if (item.path === '/christmas') {
        const endTime = 1640448000000; // new Date('2021 12 25').getTime()
        const currentTime = Date.now();
        item.isShowHeader = currentTime < endTime;
      }
    }
  });
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }
  return (
    <div>
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
      <Suspense
        fallback={
          <div>
            <Loading />
          </div>
        }
      >
        <div className="content-box">
          <div className="content">
            {/* Route 组件必须是Switch 的子元素 不然正常渲染的时候 404页面也会渲染 */}
            <Switch>
              {
                routerConfig.map((item, index) => {
                  const isRedrict = !!item.authCheck && !token;
                  console.log('isRedrict', isRedrict);
                  
                  return !isRedrict ? <Route
                    exact={item.exact}
                    key={index}
                    path={item.path}
                    component={(location: any) => {
                      commonStore.getHistory({ ...location });
                      return <item.component {...location} />
                    }}
                  /> : <Redirect key={index} to={{
                    pathname: '/login',
                    state: location
                  }} />
                })
              }
              <Route component={PageNotFound} />
            </Switch>
          </div>
        </div>
      </Suspense>
      <Footer />
      {
        isLoginModalShow && <LoginModal onClose={onToggleLoginModal} />
      }
    </div>
  );
});

export default Routers;