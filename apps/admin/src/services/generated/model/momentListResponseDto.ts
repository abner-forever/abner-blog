import type { MomentDto } from "./momentDto";

export interface MomentListResponseDto {
  /** 沸点列表 */
  list: MomentDto[];
  /** 总数 */
  total: number;
}
