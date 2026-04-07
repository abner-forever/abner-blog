import UserDetail from './index';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

export const userDetailRoutes: RouteConfig[] = [
  {
    path: '/analytics/users/:anonymousId',
    element: <UserDetail />,
    requireAuth: true,
  },
];