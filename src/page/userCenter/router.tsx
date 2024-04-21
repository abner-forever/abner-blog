import React from "react";
import ExerciseCheckIn from "./containers/exerciseCheckIn";
import { lazyLoad } from "@/utils/lazyLoad";

const routes = [
  {
    path: "/user/exercise",
    element: lazyLoad(() => import("@/page/userCenter/containers/exercise")),
    title: "运动",
    isShowHeader: false,
    auth: true,
  },
  {
    path: "/user/exercise/checkIn",
    element: <ExerciseCheckIn />,
    title: "运动",
    isShowHeader: false,
    auth: true,
  },
  {
    path: "/user/myArticle",
    element: lazyLoad(() => import("@/page/userCenter/containers/myArticles")),
    title: "我的笔记",
    auth: true,
  },
  {
    path: "/user/account",
    element: lazyLoad(() => import("@/page/userCenter/containers/account/Account")),
    title: "账号信息",
    auth: true,
  },
];

export default routes;
