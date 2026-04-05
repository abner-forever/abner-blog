export type AdminControllerGetUsersStatus =
  (typeof AdminControllerGetUsersStatus)[keyof typeof AdminControllerGetUsersStatus];

export const AdminControllerGetUsersStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
