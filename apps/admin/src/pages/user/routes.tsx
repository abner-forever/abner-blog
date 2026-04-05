import UserManage from "./UserManage";
import type { RouteConfig } from "../../routes";

export const userRoutes: RouteConfig[] = [
  {
    path: "/users",
    element: <UserManage />,
    requireAuth: true,
  },
];
