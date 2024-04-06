import React, { ComponentType, Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import { Loading, PageNotFound } from "@/components";
import HomePage from "../page/homePage";
import About from "../page/About";
import ArticleDetail from "../page/detailPage";
import MyArticle from "@/page/myArticles";
import Login from "../page/auth/login/Login";
import AddMD from "../page/AddMD";
import { ViteEnv } from "@/config";
import EditorPage from "@/page/editPage";
import UserCenter from "@/page/userCenter";
import Video from "@/page/video";

// 自定义懒加载函数
const lazyLoad = (factory: () => Promise<{ default: ComponentType }>) => {
  const Module = lazy(factory);
  return (
    <Suspense fallback={<Loading />}>
      <Module />
    </Suspense>
  );
};

console.log("env", ViteEnv);

// 路由表配置
const routerList = [
  {
    path: "/",
    element: <HomePage />,
    exact: true,
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
    authCheck: true, // 登录验证
  },
  {
    path: "/addArticle",
    element: lazyLoad(() => import("@/page/editPage")),
    title: "新增文章",
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: "/articleDetail/:id",
    element: lazyLoad(() => import("@/page/detailPage")),
    title: "文章详情",
    isShowHeader: false,
  },
  {
    path: "/admin",
    element: <UserCenter />,
    title: "我的",
    exact: true,
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: "/myArticle",
    element: <MyArticle />,
    title: "我的文章",
    exact: true,
    isShowHeader: false,
  },
  {
    path: "/404",
    element: <PageNotFound />,
  },
  {
    path: "/about",
    element: <About />,
    title: "日志",
    exact: true,
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: "/login",
    element: <Login />,
    title: "登录",
    exact: true,
    isShowHeader: ViteEnv !== "online",
  },
  {
    path: "/add",
    element: <AddMD />,
    title: "markdown",
    exact: true,
    isShowHeader: false,
  },

  {
    path: "*",
    element: <Navigate to="/404" />,
  },
];

export default routerList;
