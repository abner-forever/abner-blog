export type GetAdminUsersStatus =
  (typeof GetAdminUsersStatus)[keyof typeof GetAdminUsersStatus];

export const GetAdminUsersStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
