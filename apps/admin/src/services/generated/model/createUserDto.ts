import type { CreateUserDtoRole } from "./createUserDtoRole";
import type { CreateUserDtoStatus } from "./createUserDtoStatus";

export interface CreateUserDto {
  /** 用户名（英文，唯一） */
  username: string;
  /** 密码 */
  password: string;
  /** 邮箱（唯一） */
  email: string;
  /** 昵称 */
  nickname?: string;
  /** 用户角色 */
  role?: CreateUserDtoRole;
  /** 用户状态 */
  status?: CreateUserDtoStatus;
}
