export type UpdateUserDtoStatus =
  (typeof UpdateUserDtoStatus)[keyof typeof UpdateUserDtoStatus];

export const UpdateUserDtoStatus = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;
