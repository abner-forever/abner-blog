export interface UserProfileDto {
  id: number;
  username: string;
  nickname?: string | null;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
