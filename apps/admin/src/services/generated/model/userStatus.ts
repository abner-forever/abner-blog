export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
