export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserRole = {
  admin: "admin",
  user: "user",
} as const;
