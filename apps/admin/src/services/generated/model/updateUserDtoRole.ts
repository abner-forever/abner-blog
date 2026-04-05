export type UpdateUserDtoRole =
  (typeof UpdateUserDtoRole)[keyof typeof UpdateUserDtoRole];

export const UpdateUserDtoRole = {
  admin: "admin",
  user: "user",
} as const;
