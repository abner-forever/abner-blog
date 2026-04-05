import BlogManage from "./BlogManage";
import BlogEdit from "./BlogEdit";
import type { RouteConfig } from "../../routes";

export const blogRoutes: RouteConfig[] = [
  {
    path: "/blogs",
    element: <BlogManage />,
    requireAuth: true,
  },
  {
    path: "/blogs/:id/edit",
    element: <BlogEdit />,
    requireAuth: true,
  },
];
