import type { AdminControllerGetUsersStatus } from "./adminControllerGetUsersStatus";

export type AdminControllerGetUsersParams = {
  page?: string;
  size?: string;
  keyword?: string;
  status?: AdminControllerGetUsersStatus;
};
