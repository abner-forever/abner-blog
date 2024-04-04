import React, { Suspense, useState } from "react";
import { BrowserRouter, useRoutes, useLocation, useNavigationType } from "react-router-dom";
import { Footer, LoginModal, Header, Loading } from "@/components";
import routerConfig from "./routers";
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import "@/assets/styles/app.less";

const App = () => {
  const { pathname } = useLocation()
  let routes = useRoutes(routerConfig, pathname);
  const navigateType = useNavigationType();
  //@ts-ignore
  const { nodeRef } =
    routerConfig.find((route) => route.path === location.pathname) ?? {};
  return <TransitionGroup
    childFactory={(child) =>
      React.cloneElement(child, { classNames: ANIMATION_MAP[navigateType] })
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
  </TransitionGroup>;
};
const ANIMATION_MAP = {
  PUSH: "forward",
  POP: "back",
  REPLACE: "back",
};

const Routers = () => {
  const [isLoginModalShow, setIsModalShow] = useState(false);
  const onToggleLoginModal = () => {
    setIsModalShow(!isLoginModalShow)
  }

  return (
    <BrowserRouter>
      <Header
        onToggleLoginModal={onToggleLoginModal}
        routerConfig={routerConfig}
      />
      <div className="content-wrap">
        <div className="content">
          <Suspense fallback={<Loading />}>
            <App />
          </Suspense>
        </div>
      </div>
      <Footer />
      {
        isLoginModalShow && <LoginModal onClose={onToggleLoginModal} />
      }
    </BrowserRouter>
  );
};

export default Routers;

