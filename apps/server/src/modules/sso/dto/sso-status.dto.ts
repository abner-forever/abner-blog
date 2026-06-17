export class SSOStatusDto {
  authenticated: boolean;
  userId?: number;
  username?: string;
  role?: string;
  email?: string;
}
