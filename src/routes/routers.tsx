import React,{lazy} from 'react'
import { Navigate } from 'react-router-dom'
import { PageNotFound } from "@/components";
import HomePage from '../page/homePage'
import Demo from '../page/demo'
import UserCenter from '../page/userCenter'
import About from '../page/About'
import ArticleDetail from '../page/detailPage'
import MyArticle from '../page/MyArticle'
import EditPage from '../page/editPage'
import Login from '../page/login'
import AddMD from '../page/AddMD'

// 快速导入工具函数
// const lazyLoad = async (moduleName: string) => {
//   const Module = lazy(() => import(`../page/${moduleName}`));
//   return <Module />;
// };
 
// 路由表配置
const routes = [
  {
    path: '/',
    element: <HomePage />,
    exact: true,
    title: '首页',
    isShowHeader: true
  },
  {
    path: '/demo',
    element: <Demo />,
    title: 'Demo',
    isShowHeader: true,
  },
  {
    path: '/edit/:id',
    element: <EditPage />,
    title: '编辑',
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/addArticle',
    element: <EditPage />,
    title: '新增文章',
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/articleDetail/:id',
    element: <ArticleDetail />,
    title: '文章详情',
    isShowHeader: false
  },
  {
    path: '/mine',
    element: <UserCenter />,
    title: '我的',
    exact: true,
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/myArticle',
    element: <MyArticle />,
    title: '我的文章',
    exact: true,
    isShowHeader: false
  },
  {
    path: '/404',
    element: <PageNotFound />
  },
  {
    path: '/about',
    element: <About />,
    title: '日志',
    exact: true,
    isShowHeader: false,
    authCheck: true, // 登录验证
  },
  {
    path: '/login',
    element: <Login/>,
    title: '登录',
    exact: true,
    isShowHeader: false
  },
  {
    path: '/add',
    element: <AddMD/>,
    title: 'markdown',
    exact: true,
    isShowHeader: false
  },
  
  {
    path: "*",
    element: <Navigate to='/404' />,
  },
]
 
export default routes
