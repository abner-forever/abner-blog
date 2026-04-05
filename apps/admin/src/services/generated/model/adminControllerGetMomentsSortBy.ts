export type AdminControllerGetMomentsSortBy =
  (typeof AdminControllerGetMomentsSortBy)[keyof typeof AdminControllerGetMomentsSortBy];

export const AdminControllerGetMomentsSortBy = {
  time: "time",
  hot: "hot",
} as const;
