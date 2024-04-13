import React, { Suspense } from "react";
import {
  BrowserRouter,
  useNavigationType,
  Route,
  Routes,
  useRoutes,
  useLocation,
} from "react-router-dom";
import { Loading } from "@/components";
import routerList, { RouteConfig } from "./routers";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import "@/assets/styles/app.less";
import "./route.less";

import Container from "@/layout/Container";
import AuthRoute from "./AuthRouter";
const ANIMATION_MAP = {
  PUSH: "forward",
  POP: "back",
  REPLACE: "back",
};

const App = () => {
  const { pathname } = useLocation();
  let routes = useRoutes(routerList, pathname);
  const navigateType = useNavigationType();
  //@ts-ignore
  const { nodeRef } =
    routerList.find(route => route.path === location.pathname) ?? {};
  // 处理我们的routers
  const RouteAuthFun = (routeList: RouteConfig[]) => {
    return routeList.map((item: RouteConfig) => {
      return (
        <Route
          path={item.path}
          element={
            <AuthRoute auth={item.auth} key={item.path}>
              {item.element}
            </AuthRoute>
          }
          key={item.path}
        >
          {/* 递归调用，因为可能存在多级的路由 */}
          {item?.children && RouteAuthFun(item.children)}
        </Route>
      );
    });
  };

  return (
    <Container>
      <Suspense fallback={<Loading />}>
        <TransitionGroup
          childFactory={child =>
            React.cloneElement(child, {
              classNames: ANIMATION_MAP[navigateType],
            })
          }
        >
          <CSSTransition
            key={location.pathname}
            nodeRef={nodeRef}
            timeout={300}
            unmountOnExit
          >
            {/* TODO: 路由动画有问题 */}
            {/* <Routes>{RouteAuthFun(routerList)}</Routes> */}
            {routes}
          </CSSTransition>
        </TransitionGroup>
      </Suspense>
    </Container>
  );
};
const Routers = () => {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

export default Routers;
