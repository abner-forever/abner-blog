export type GetAdminMomentsSortBy =
  (typeof GetAdminMomentsSortBy)[keyof typeof GetAdminMomentsSortBy];

export const GetAdminMomentsSortBy = {
  time: "time",
  hot: "hot",
} as const;
