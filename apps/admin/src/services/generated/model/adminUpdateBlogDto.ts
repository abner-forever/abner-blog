export interface AdminUpdateBlogDto {
  /** 博客标题 */
  title?: string;
  /** 博客摘要 */
  summary?: string;
  /** 博客正文（Markdown） */
  content?: string;
  /** 封面图片 URL */
  cover?: string;
  /** 是否已发布 */
  isPublished?: boolean;
  /** Markdown 预览主题 */
  mdTheme?: string;
  /** 标签列表 */
  tags?: string[];
}
