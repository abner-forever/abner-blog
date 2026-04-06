/**
 * 用户状态
 */
export type UpdateUserStatusDtoStatus =
  (typeof UpdateUserStatusDtoStatus)[keyof typeof UpdateUserStatusDtoStatus];

export const UpdateUserStatusDtoStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
