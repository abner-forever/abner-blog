import TrackEvents from './index';

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  requireAuth?: boolean;
}

export const trackEventsRoutes: RouteConfig[] = [
  {
    path: '/analytics/events',
    element: <TrackEvents />,
    requireAuth: true,
  },
];
