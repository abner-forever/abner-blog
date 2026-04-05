export type MomentsControllerFindAllSortBy =
  (typeof MomentsControllerFindAllSortBy)[keyof typeof MomentsControllerFindAllSortBy];

export const MomentsControllerFindAllSortBy = {
  time: "time",
  hot: "hot",
} as const;
