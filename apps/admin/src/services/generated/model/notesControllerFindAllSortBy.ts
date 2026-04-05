export type NotesControllerFindAllSortBy =
  (typeof NotesControllerFindAllSortBy)[keyof typeof NotesControllerFindAllSortBy];

export const NotesControllerFindAllSortBy = {
  time: "time",
  hot: "hot",
} as const;
