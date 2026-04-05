import type { Object } from "./object";

export type AdminControllerGetBlogsParams = {
  page?: string;
  size?: string;
  keyword?: string;
  isPublished?: boolean;
  sort?: string;
  sortBy?: string;
  sortOrder?: Object;
};
