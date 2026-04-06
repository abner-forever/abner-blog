import type { GetAdminUsersStatus } from "./getAdminUsersStatus";

export type GetAdminUsersParams = {
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页数量
   */
  size?: number;
  /**
   * 搜索关键词（用户名/昵称/邮箱）
   */
  keyword?: string;
  /**
   * 用户状态
   */
  status?: GetAdminUsersStatus;
};
