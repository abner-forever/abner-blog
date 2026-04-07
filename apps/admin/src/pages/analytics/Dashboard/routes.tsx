import Dashboard from './index';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

export const dashboardRoutes: RouteConfig[] = [
  {
    path: '/analytics/dashboard',
    element: <Dashboard />,
    requireAuth: true,
  },
];