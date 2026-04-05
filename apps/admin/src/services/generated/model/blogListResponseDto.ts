import type { BlogDto } from "./blogDto";

export interface BlogListResponseDto {
  /** 博客列表 */
  list: BlogDto[];
  /** 总数 */
  total: number;
}
