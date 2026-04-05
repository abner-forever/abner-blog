export interface ToggleLikeResponseDto {
  /** 操作后是否已点赞 */
  isLiked: boolean;
  /** 当前点赞总数 */
  likesCount: number;
}
