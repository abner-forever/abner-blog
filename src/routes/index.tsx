import React, { Suspense, useState } from "react";
import {
  BrowserRouter,
  useRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { Footer, LoginModal, Loading } from "@/components";
import routerConfig from "./routers";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import "@/assets/styles/app.less";
import "./route.less";
import { isMobile } from "@/utils/userAgent";
const ANIMATION_MAP = {
  PUSH: "forward",
  POP: "back",
  REPLACE: "back",
};

const App = () => {
  const { pathname } = useLocation();
  let routes = useRoutes(routerConfig, pathname);
  const navigateType = useNavigationType();
  //@ts-ignore
  const { nodeRef } =
    routerConfig.find(route => route.path === location.pathname) ?? {};
  return (
    <>
      <div className="content-wrap">
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
              {routes}
            </CSSTransition>
          </TransitionGroup>
        </Suspense>
      </div>
      {!isMobile() && <Footer />}
    </>
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
