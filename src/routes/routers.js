import React from 'react'
import HomePage from '../page/homePage'
// 路由表配置
const routes = [
    {
        path: '/',
        component: HomePage,
        exact: true,
        title: '首页',
        isShowHeader:true
    },
    {
        path: '/demo',
        component: React.lazy(()=>import('../page/demo')),
        title: 'Demo',
        isShowHeader:true,
    },
   {
        path: '/edit/:id',
        component: React.lazy(()=>import('../page/editPage')),
        title: '编辑',
        isShowHeader:false,
        authCheck:true, // 登录验证
    },
    {
        path: '/addArticle',
        component: React.lazy(()=>import('../page/editPage')),
        title: '新增文章',
        isShowHeader:false,
        authCheck:true, // 登录验证
    },
     {
        path: '/articleDetail/:id',
        component: React.lazy(()=>import('../page/detailPage')),
        title: '文章详情',
        isShowHeader:false
    },{
        path: '/mine',
        component: React.lazy(()=>import('../page/minePage')),
        title: '我的',
        exact: true,
        isShowHeader: false,
        authCheck:true, // 登录验证
    },
    {
        path: '/myArticle',
        component: React.lazy(()=>import('../page/MyArticle')),
        title: '我的文章',
        exact: true,
        isShowHeader:false
    },
    {
        path: '/login',
        component: React.lazy(()=>import('../page/login')),
        title: '登录',
        exact: true,
        isShowHeader:false
    },
    {
        path: '/add-md',
        component: React.lazy(()=>import('../page/AddMD')),
        title: '登录',
        exact: true,
        isShowHeader:false
    },
    {
        path: '/christmas',
        component: React.lazy(()=>import('../page/Christmas')),
        title: '圣诞节快乐',
        exact: true,
        isShowHeader:false
    },
    {
        path: '/about',
        component: React.lazy(()=>import('../page/About')),
        title: '日志',
        exact: true,
        isShowHeader:true,
        authCheck:true, // 登录验证
    }
]
export default routes
