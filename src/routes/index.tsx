import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Link,
  withRouter,
  Route,
  Switch,
} from "react-router-dom";
import routerConfig from "./routers";
import "@/index.scss";
import { Loading, PageNotFound, Footer } from "@/components";
import Cookies from "js-cookie";
import { commonStore } from "@/utils/store";
const Routers = () => {
  return (
    <Router>
      <AuthToken />
    </Router>
  );
};

const AuthToken = withRouter(() => {
  let token = Cookies.get("token");
  const path = window.location.pathname;
  routerConfig.forEach((item:any, index) => {
    if (path === item.path) {
      if (item.isShowHeader) {
        item.current = true;
      } else {
      }
    } else {
      item.current = false;
    }
  });
  return (
    <div>
      <header className="header-container">
        <ul className="banner">
          <div className='banner-left'>
            <span className='banner-logo'>Abner的笔记</span>
            {routerConfig.map(
              (item:any, index) =>
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
              <Link to='/login'>登录</Link>
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
              {routerConfig.map((item, index) => (
                <Route
                  exact={item.exact}
                  key={index}
                  path={item.path}
                  component={(location:any) => {
                    commonStore.getHistory({ ...location });
                    return <item.component {...location} />;
                  }}
                />
              ))}
              <Route component={PageNotFound} />
            </Switch>
          </div>
        </div>
      </Suspense>
      <Footer />
    </div>
  );
});

export default Routers;
