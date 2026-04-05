import type { CreateUserDtoRole } from "./createUserDtoRole";
import type { CreateUserDtoStatus } from "./createUserDtoStatus";

export interface CreateUserDto {
  username: string;
  password: string;
  email: string;
  nickname?: string;
  role?: CreateUserDtoRole;
  status?: CreateUserDtoStatus;
}
