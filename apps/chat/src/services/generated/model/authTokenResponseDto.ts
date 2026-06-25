export interface AuthTokenResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    nickname?: string;
    email?: string;
    avatar?: string;
  };
}
