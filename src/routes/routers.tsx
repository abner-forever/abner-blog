import React, { MutableRefObject } from "react";
import { Navigate } from "react-router-dom";
import { PageNotFound } from "@/components";
import { ViteEnv } from "@/config";
import { lazyLoad } from "@/utils/lazyLoad";

import HomePage from "@/page/homePage";
import UserCenter from "@/page/userCenter";
import Login from "@/page/auth/login";
import Todo from "@/page/todo";
import userRouters from "@/page/userCenter/router";
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  auth?: boolean;
  children?: RouteConfig[];
  redirect?: string;
  isShowHeader?: boolean;
  title?: string;
  nodeRef?: MutableRefObject<null>;
}

// 路由表配置
const routerList: RouteConfig[] = [
  {
    path: "/",
    element: <HomePage />,
    title: "首页",
    isShowHeader: false,
  },
  {
    path: "/video",
    element: lazyLoad(() => import("@/page/video")),
    title: "视频",
    isShowHeader: true,
  },
  {
    path: "/edit/:id",
    element: lazyLoad(() => import("@/page/editPage")),
    title: "编辑",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/addArticle",
    element: lazyLoad(() => import("@/page/editPage")),
    title: "新增笔记",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/articleDetail/:id",
    element: lazyLoad(() => import("@/page/detailPage")),
    title: "笔记详情",
    isShowHeader: false,
  },
  {
    path: "/userCenter",
    element: <UserCenter />,
    title: "我的",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/christmas",
    element: lazyLoad(() => import("@/page/Christmas")),
    title: "圣诞节",
    isShowHeader: false,
  },
  {
    path: "/todo",
    element: <Todo />,
    title: "待办",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/login",
    element: <Login />,
    title: "登录",
    isShowHeader: ViteEnv !== "online",
  },
  {
    path: "/add",
    element: lazyLoad(() => import("@/page/AddMD")),
    title: "markdown",
    isShowHeader: false,
  },
  ...userRouters,
  {
    path: "/404",
    element: <PageNotFound />,
  },
  {
    path: "*",
    element: <Navigate to="/404" />,
  },
];

export default routerList;
