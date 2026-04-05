export interface MarkNotificationsReadDto {
  /** 要标记已读的通知 ID 列表 */
  ids?: number[];
  /** 是否全部标记已读 */
  markAll?: boolean;
}
