export type GetAdminDailyViewsType =
  (typeof GetAdminDailyViewsType)[keyof typeof GetAdminDailyViewsType];

export const GetAdminDailyViewsType = {
  pv: "pv",
  uv: "uv",
  all: "all",
} as const;
