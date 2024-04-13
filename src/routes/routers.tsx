import React, { ComponentType, Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { Loading, PageNotFound } from "@/components";
import HomePage from "@/page/homePage";
import { ViteEnv } from "@/config";
import UserCenter from "@/page/userCenter";
import Todo from "@/page/todo";
import Container from "@/layout/Container";
// 自定义懒加载函数
const lazyLoad = (factory: () => Promise<{ default: ComponentType }>) => {
  const Module = lazy(factory);
  return (
    <Suspense fallback={<Loading />}>
      <Module />
    </Suspense>
  );
};

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  auth?: boolean;
  children?: RouteConfig[];
  redirect?:string
  isShowHeader?: boolean;
  title?: string;
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
    isShowHeader: true,
    auth: true, // 登录验证
  },
  {
    path: "/todo",
    element: <Todo />,
    title: "待办",
    isShowHeader: false,
    auth: true, // 登录验证
  },
  {
    path: "/myArticle",
    element: lazyLoad(() => import("@/page/myArticles")),
    title: "我的笔记",
    isShowHeader: false,
  },
  {
    path: "/christmas",
    element: lazyLoad(() => import("@/page/Christmas")),
    title: "圣诞节",
    isShowHeader: false,
  },
  {
    path: "/login",
    element: lazyLoad(() => import("@/page/auth/login/Login")),
    title: "登录",
    isShowHeader: ViteEnv !== "online",
  },
  {
    path: "/add",
    element: lazyLoad(() => import("@/page/AddMD")),
    title: "markdown",
    isShowHeader: false,
  },
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
