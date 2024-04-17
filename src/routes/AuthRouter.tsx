import { useEffect } from "react";
import routes, { RouteConfig } from "./routers";
import { useLocation, useNavigate } from "react-router-dom";
import { getToken } from "@/utils/authentication";

const getCurrentRouterMap = (
  routers: RouteConfig[],
  path: string
): RouteConfig => {
  for (let router of routers) {
    if (router.path == path) return router;
    if (router.children) {
      const childRouter = getCurrentRouterMap(router.children, path);
      if (childRouter) return childRouter;
    }
  }
  return routes[routes.length - 1];
};

export const AuthRouter = ({ children }: any) => {
  const location = useLocation();
  const navigator = useNavigate();
  const isLogin = getToken();
  useEffect(() => {
    let router = getCurrentRouterMap(routes, location.pathname);
    if (!isLogin && router.auth) {
      navigator("/login");
    }
  }, [location.pathname]);
  return children;
};
