import CommentManage from "./CommentManage";
import type { RouteConfig } from "../../routes";

export const commentRoutes: RouteConfig[] = [
  {
    path: "/comments",
    element: <CommentManage />,
    requireAuth: true,
  },
];
