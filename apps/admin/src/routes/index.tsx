import type { RouteObject } from "react-router";
import { authRoutes } from "../pages/auth/routes";
import { dashboardRoutes, indexRoute } from "../pages/dashboard/routes";
import { userRoutes } from "../pages/user/routes";
import { blogRoutes } from "../pages/blog/routes";
import { momentRoutes } from "../pages/moment/routes";
import { commentRoutes } from "../pages/comment/routes";
import { systemAnnouncementRoutes } from "../pages/system-announcement/routes";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

/** 登录后 AdminLayout 的 Outlet 子路由 */
export const adminLayoutChildren: RouteConfig[] = [
  ...dashboardRoutes,
  ...userRoutes,
  ...blogRoutes,
  ...momentRoutes,
  ...commentRoutes,
  ...systemAnnouncementRoutes,
  indexRoute,
];

const routes: RouteConfig[] = [...authRoutes, ...adminLayoutChildren];

export const routeConfig: RouteObject[] = routes.map((route) => ({
  path: route.path,
  element: route.element,
}));

export { authRoutes };
