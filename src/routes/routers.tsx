import React,{lazy} from 'react'
import { Navigate } from 'react-router-dom'
import { PageNotFound } from "@/components";

// 快速导入工具函数
const lazyLoad = (moduleName: string) => {
  const Module = lazy(() => import(`../page/${moduleName}`));
  return <Module />;
};
 
// 路由表配置
const routes = [
  {
    path: '/',
    element: lazyLoad('homePage'),
    exact: true,
    title: '首页',
    isShowHeader: true
  },
  {
    path: '/demo',
    element: lazyLoad('demo'),
    title: 'Demo',
    isShowHeader: true,
  },
  {
    path: '/edit/:id',
    element: lazyLoad('editPage'),
    title: '编辑',
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/addArticle',
    element:  lazyLoad('editPage'),
    title: '新增文章',
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/articleDetail/:id',
    element:  lazyLoad('articleDetail'),
    title: '文章详情',
    isShowHeader: false
  },
  {
    path: '/myArticle',
    element: lazyLoad('myArticle'),
    title: '我的文章',
    isShowHeader: false
  },
  {
    path: '/mine',
    element: lazyLoad('userCenter'),
    title: '我的',
    exact: true,
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/404',
    element: <PageNotFound />
  },
  {
    path: '/about',
    element: lazyLoad('About'),
    title: '日志',
    exact: true,
    isShowHeader: true,
    authCheck: true, // 登录验证
  },
  {
    path: '/login',
    element: lazyLoad('login'),
    title: '登录',
    exact: true,
    isShowHeader: false
  },
  {
    path: "*",
    element: <Navigate to='/404' />,
  },
]
 
export default routes
