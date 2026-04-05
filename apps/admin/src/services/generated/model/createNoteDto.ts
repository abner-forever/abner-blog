export interface CreateNoteDto {
  /**
   * 笔记标题
   * @maxLength 120
   */
  title?: string;
  /**
   * 笔记内容
   * @maxLength 1000
   */
  content: string;
  /** 图片数组 */
  images?: string[];
  /** 视频数组 */
  videos?: string[];
  /** 话题ID */
  topicId?: number;
  /** 地理位置 */
  location?: string;
  /** 视频封面图 */
  cover?: string;
}
