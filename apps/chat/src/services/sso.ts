import { httpMutator } from './http';

export interface SSOStatus {
  authenticated: boolean;
  userId?: number;
  username?: string;
  role?: string;
  email?: string;
}

export const getSSOStatus = () =>
  httpMutator<SSOStatus>({
    url: '/api/sso/status',
    method: 'GET',
  });

export const ssoLogout = () =>
  httpMutator<{ success: boolean; message: string; redirectUrl?: string }>({
    url: '/api/sso/logout',
    method: 'POST',
  });
