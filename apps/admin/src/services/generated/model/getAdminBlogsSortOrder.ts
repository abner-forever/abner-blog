export type GetAdminBlogsSortOrder =
  (typeof GetAdminBlogsSortOrder)[keyof typeof GetAdminBlogsSortOrder];

export const GetAdminBlogsSortOrder = {
  ASC: "ASC",
  DESC: "DESC",
} as const;
