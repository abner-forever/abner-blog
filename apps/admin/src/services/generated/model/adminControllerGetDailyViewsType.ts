export type AdminControllerGetDailyViewsType =
  (typeof AdminControllerGetDailyViewsType)[keyof typeof AdminControllerGetDailyViewsType];

export const AdminControllerGetDailyViewsType = {
  pv: "pv",
  uv: "uv",
  all: "all",
} as const;
