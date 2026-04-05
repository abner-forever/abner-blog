export type AdminUsersControllerGetUsersStatus =
  (typeof AdminUsersControllerGetUsersStatus)[keyof typeof AdminUsersControllerGetUsersStatus];

export const AdminUsersControllerGetUsersStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
