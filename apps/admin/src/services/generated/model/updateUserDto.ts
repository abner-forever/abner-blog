import type { UpdateUserDtoRole } from "./updateUserDtoRole";
import type { UpdateUserDtoStatus } from "./updateUserDtoStatus";

export interface UpdateUserDto {
  nickname?: string;
  email?: string;
  password?: string;
  role?: UpdateUserDtoRole;
  status?: UpdateUserDtoStatus;
}
