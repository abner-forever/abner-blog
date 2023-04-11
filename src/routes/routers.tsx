import React,{lazy} from 'react'
import { Navigate } from 'react-router-dom'
import { PageNotFound } from "@/components";
import HomePage from '../page/homePage'
import UserCenter from '../page/userCenter'
import About from '../page/About'
import ArticleDetail from '../page/detailPage'
import MyArticle from '../page/MyArticle'
import EditPage from '../page/editPage'
import Login from '../page/login'
import AddMD from '../page/AddMD'

// 动态引入路由
const lazyLoad = (moduleName: string) => {
  const viteModule = import.meta.glob('../page/*/index.tsx');
  const URL = `../page/${moduleName}/index.tsx`;
  let Module = React.lazy(viteModule[`${URL}`] as any);
  return <Module />
}


// 路由表配置
const routerList = [
  {
    path: '/',
    element: <HomePage />,
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
    path: '/gpt',
    element: lazyLoad('chatgpt'),
    title: 'gpt',
    isShowHeader: false,
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
 
export default routerList
