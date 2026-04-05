import { Navigate } from "react-router-dom";
import Dashboard from "./index";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

export const dashboardRoutes: RouteConfig[] = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    requireAuth: true,
  },
];

export const indexRoute: RouteConfig = {
  path: "",
  element: <Navigate to="/dashboard" replace />,
};
