import type { RouteConfig } from "../../routes";
import SystemAnnouncementManage from "./SystemAnnouncementManage";

export const systemAnnouncementRoutes: RouteConfig[] = [
  {
    path: "/system-announcements",
    element: <SystemAnnouncementManage />,
    requireAuth: true,
  },
];
