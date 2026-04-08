import type { UserProfileDto } from "./userProfileDto";

export interface UserListResponse {
  /** 用户列表 */
  list: UserProfileDto[];
  /** 总用户数 */
  total: number;
  /** 每页用户数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 当前页码 */
  page: number;
  /** 是否有下一页 */
  hasNextPage: boolean;
  /** 是否有上一页 */
  hasPrevPage: boolean;
}
