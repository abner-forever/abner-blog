import React from "react";
import Exercise from "./containers/exercise";
import ExerciseCheckIn from "./containers/exerciseCheckIn";
import { lazyLoad } from "@/utils/lazyLoad";

const routes =[
  {
    path: "/exercise",
    element: lazyLoad(() => import("@/page/userCenter/containers/exercise")),
    title: "运动",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/exercise/checkIn",
    element: <ExerciseCheckIn />,
    title: "运动",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/myArticle",
    element: lazyLoad(() => import("@/page/userCenter/containers/myArticles")),
    title: "我的笔记",
    isShowHeader: false,
  },
]

export default routes;