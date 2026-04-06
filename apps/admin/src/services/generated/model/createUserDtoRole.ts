/**
 * 用户角色
 */
export type CreateUserDtoRole =
  (typeof CreateUserDtoRole)[keyof typeof CreateUserDtoRole];

export const CreateUserDtoRole = {
  admin: "admin",
  user: "user",
} as const;
