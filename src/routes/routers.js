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
        path: '/add-article',
        component: React.lazy(()=>import('../page/editPage')),
        title: '新增文章',
        isShowHeader:false,
        authCheck:true, // 登录验证
    },
     {
        path: '/article-detail/:id',
        component: React.lazy(()=>import('../page/detailPage')),
        title: '文章详情',
        isShowHeader:false
    },{
        path: '/mine',
        component: React.lazy(()=>import('../page/minePage')),
        title: '关于我',
        exact: true,
        isShowHeader:false,
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
        isShowHeader:true
    }
]
export default routes
