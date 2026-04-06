import type { UserProfileDto } from "./userProfileDto";

export interface AuthTokenResponseDto {
  /** JWT 访问令牌 */
  access_token: string;
  /** 用户信息 */
  user: UserProfileDto;
}
