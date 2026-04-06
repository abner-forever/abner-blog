import type { MomentDto } from "./momentDto";

export interface MomentListResponse {
  /** 沸点列表 */
  list: MomentDto[];
  /** 总数 */
  total: number;
}
