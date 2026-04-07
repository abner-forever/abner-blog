import UserList from './index';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

export const userListRoutes: RouteConfig[] = [
  {
    path: '/analytics/users',
    element: <UserList />,
    requireAuth: true,
  },
];