import React, { Suspense, useState } from "react";
import {
  Link,
  withRouter,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import routerConfig from "./routers";
import "@/index.scss";
import { Loading, PageNotFound, Footer, LoginModal } from "@/components";
import { commonStore } from "@/utils/store";

const AuthToken = withRouter(({ token }: any) => {
  const { pathname } = location;
  const targetRouterConfig = routerConfig.find(
    (item) => item.path === pathname
  );
  console.log('targetRouterConfig',targetRouterConfig);
  
  routerConfig.forEach((item: any, index) => {
    if (pathname === item.path) {
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
  return (
    <div>
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
                  return <Route
                    exact={item.exact}
                    key={index}
                    path={item.path}
                    component={(location: any) => {
                      commonStore.getHistory({ ...location });
                      return <item.component {...location} />
                    }}
                  />
                })
              }
              {/* {
                routerConfig.map((item, index) => {
                  const isRedrict = !!item.authCheck && !token;
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
              } */}
              <Route component={PageNotFound} />
            </Switch>
          </div>
        </div>
      </Suspense>
    </div>
  );
});
export default AuthToken;