import { Navigate } from "react-router-dom";
import MomentManage from "./MomentManage";
import MomentEdit from "./MomentEdit";
import TopicManage from "./TopicManage";
import type { RouteConfig } from "../../routes";

export const momentRoutes: RouteConfig[] = [
  {
    path: "/moments",
    element: <Navigate to="/moments/list" replace />,
    requireAuth: true,
  },
  {
    path: "/moments/list",
    element: <MomentManage />,
    requireAuth: true,
  },
  {
    path: "/moments/topics",
    element: <TopicManage />,
    requireAuth: true,
  },
  {
    path: "/moments/:id/edit",
    element: <MomentEdit />,
    requireAuth: true,
  },
];
