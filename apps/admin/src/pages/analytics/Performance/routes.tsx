import Performance from './index';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

export const performanceRoutes: RouteConfig[] = [
  {
    path: '/analytics/performance',
    element: <Performance />,
    requireAuth: true,
  },
];
