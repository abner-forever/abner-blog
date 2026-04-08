import React, { lazy } from 'react';

// 懒加载组件 - 使用新的目录结构
const BlogList = lazy(() => import('@pages/blog/BlogList'));
const CreateBlog = lazy(() => import('@pages/blog/CreateBlog'));
const EditBlog = lazy(() => import('@pages/blog/EditBlog'));
const BlogDetail = lazy(() => import('@pages/blog/BlogDetail'));
const Profile = lazy(() => import('@pages/user/Profile'));
const ProfileEdit = lazy(() => import('@pages/user/ProfileEdit'));
const ResumeEdit = lazy(() => import('@pages/user/ResumeEdit'));
const Resume = lazy(() => import('@pages/user/Resume'));
const Login = lazy(() => import('@pages/auth/Login'));
const Register = lazy(() => import('@pages/auth/Register'));
const ForgotPassword = lazy(() => import('@pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@pages/auth/ResetPassword'));
const McpConnect = lazy(() => import('@pages/auth/McpConnect'));
const TodoList = lazy(() => import('@pages/todo/TodoList'));
const MyFavorites = lazy(() => import('@pages/user/MyFavorites'));
const MomentList = lazy(() => import('@pages/moment/MomentList'));
const CreateMoment = lazy(() => import('@pages/moment/CreateMoment'));
const MomentDetail = lazy(() => import('@pages/moment/MomentDetail'));
const MyDemo = lazy(() => import('@pages/demo/index'));
const Home = lazy(() => import('@pages/home/index'));
const NewsList = lazy(() => import('@pages/news'));
const ToolsPage = lazy(() => import('@pages/tools'));
const AboutPage = lazy(() => import('@pages/about'));
const InterviewPage = lazy(() => import('@pages/interview/index.tsx'));
const SearchPage = lazy(() => import('@pages/search'));
const UserHomePage = lazy(() => import('@pages/user/UserHome'));
const ChatPage = lazy(() => import('@pages/chat'));
const NoteList = lazy(() => import('@pages/note/NoteList'));
const NoteDetail = lazy(() => import('@pages/note/NoteDetail'));
const TopicDetail = lazy(() => import('@pages/note/TopicDetail'));
const CreateNote = lazy(() => import('@pages/note/CreateNote'));
const MessagesPage = lazy(() => import('@pages/messages'));
const NotificationsPage = lazy(() => import('@pages/notifications'));
const AnnouncementDetailPage = lazy(
  () => import('@pages/notifications/AnnouncementDetail'),
);

// 路由配置类型定义
export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  requireAuth: boolean;
}

// 路由配置表
export const routeConfig: RouteConfig[] = [
  {
    path: '/blogs',
    element: <BlogList />,
    requireAuth: false,
  },
  {
    path: '/',
    element: <Home />,
    requireAuth: false,
  },
  {
    path: '/blogs/:id',
    element: <BlogDetail />,
    requireAuth: false,
  },
  {
    path: '/blogs/:id/edit',
    element: <EditBlog />,
    requireAuth: true,
  },
  {
    path: '/login',
    element: <Login />,
    requireAuth: false,
  },
  {
    path: '/register',
    element: <Register />,
    requireAuth: false,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    requireAuth: false,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
    requireAuth: false,
  },
  {
    path: '/mcp/login',
    element: <McpConnect />,
    requireAuth: false,
  },
  {
    path: '/create',
    element: <CreateBlog />,
    requireAuth: true,
  },
  {
    path: '/favorites',
    element: <MyFavorites />,
    requireAuth: true,
  },
  {
    path: '/demo',
    element: <MyDemo />,
    requireAuth: true,
  },
  {
    path: '/todos',
    element: <TodoList />,
    requireAuth: true,
  },
  {
    path: '/profile',
    element: <Profile />,
    requireAuth: true,
  },
  {
    path: '/profile/edit',
    element: <ProfileEdit />,
    requireAuth: true,
  },
  {
    path: '/profile/resume',
    element: <ResumeEdit />,
    requireAuth: true,
  },
  {
    path: '/resume/:id',
    element: <Resume />,
    requireAuth: false,
  },
  {
    path: '/moments',
    element: <MomentList />,
    requireAuth: false,
  },
  {
    path: '/moments/create',
    element: <CreateMoment />,
    requireAuth: true,
  },
  {
    path: '/moments/:id/edit',
    element: <CreateMoment />,
    requireAuth: true,
  },
  {
    path: '/moments/:id',
    element: <MomentDetail />,
    requireAuth: false,
  },
  {
    path: '/news',
    element: <NewsList />,
    requireAuth: false,
  },
  {
    path: '/news/:id',
    element: <NewsList />,
    requireAuth: false,
  },
  {
    path: '/tools',
    element: <ToolsPage />,
    requireAuth: false,
  },
  {
    path: '/about',
    element: <AboutPage />,
    requireAuth: false,
  },
  {
    path: '/interview',
    element: <InterviewPage />,
    requireAuth: false,
  },
  {
    path: '/search',
    element: <SearchPage />,
    requireAuth: false,
  },
  {
    path: '/user/:id',
    element: <UserHomePage />,
    requireAuth: false,
  },
  {
    path: '/chat',
    element: <ChatPage />,
    requireAuth: false,
  },
  {
    path: '/messages',
    element: <MessagesPage />,
    requireAuth: true,
  },
  {
    path: '/notifications/announcements/:id',
    element: <AnnouncementDetailPage />,
    requireAuth: true,
  },
  {
    path: '/notifications',
    element: <NotificationsPage />,
    requireAuth: true,
  },
  {
    path: '/notes',
    element: <NoteList />,
    requireAuth: false,
  },
  {
    path: '/notes/create',
    element: <CreateNote />,
    requireAuth: true,
  },
  {
    path: '/notes/:id',
    element: <NoteDetail />,
    requireAuth: false,
  },
  {
    path: '/notes/topics/:id',
    element: <TopicDetail />,
    requireAuth: false,
  },
];
