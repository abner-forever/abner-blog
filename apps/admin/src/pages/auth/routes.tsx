import Login from "./Login";
import type { RouteConfig } from "../../routes";

export const authRoutes: RouteConfig[] = [
  {
    path: "/login",
    element: <Login />,
    requireAuth: false,
  },
];

export const publicOnlyRoutes: RouteConfig[] = [
  {
    path: "/login",
    element: <Login />,
  },
];
