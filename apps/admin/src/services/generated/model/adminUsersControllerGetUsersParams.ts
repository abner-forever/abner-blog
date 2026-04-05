import type { AdminUsersControllerGetUsersStatus } from "./adminUsersControllerGetUsersStatus";

export type AdminUsersControllerGetUsersParams = {
  page?: string;
  size?: string;
  keyword?: string;
  status?: AdminUsersControllerGetUsersStatus;
};
