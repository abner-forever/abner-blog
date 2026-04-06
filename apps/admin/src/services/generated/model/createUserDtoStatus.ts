/**
 * 用户状态
 */
export type CreateUserDtoStatus =
  (typeof CreateUserDtoStatus)[keyof typeof CreateUserDtoStatus];

export const CreateUserDtoStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
