import type { UpdateUserDtoRole } from "./updateUserDtoRole";
import type { UpdateUserDtoStatus } from "./updateUserDtoStatus";

export interface UpdateUserDto {
  /** 昵称 */
  nickname?: string;
  /** 邮箱 */
  email?: string;
  /** 密码 */
  password?: string;
  /** 用户角色 */
  role?: UpdateUserDtoRole;
  /** 用户状态 */
  status?: UpdateUserDtoStatus;
}
