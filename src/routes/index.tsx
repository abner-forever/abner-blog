import React, { Suspense } from "react";
import {
  BrowserRouter,
  useNavigationType,
  useRoutes,
  useLocation,
} from "react-router-dom";
import { Loading } from "@/components";
import routerList from "./routers";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { AuthRouter } from "./AuthRouter";
import Container from "@/layout/Container";
import "@/assets/styles/index.less";
import "./route.less";

const ANIMATION_MAP = {
  PUSH: "forward",
  POP: "back",
  REPLACE: "back",
};

const App = () => {
  const { pathname } = useLocation();
  let elements = useRoutes(routerList, pathname);
  const navigateType = useNavigationType();
  const { nodeRef } =
    routerList.find(route => route.path === location.pathname) ?? {};

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
            <AuthRouter>{elements}</AuthRouter>
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
