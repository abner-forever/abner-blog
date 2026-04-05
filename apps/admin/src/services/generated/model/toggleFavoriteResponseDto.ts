export interface ToggleFavoriteResponseDto {
  /** 操作后是否已收藏 */
  isFavorited: boolean;
  /** 当前收藏总数 */
  favoritesCount: number;
}
