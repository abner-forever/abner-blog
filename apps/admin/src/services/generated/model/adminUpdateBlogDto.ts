export interface AdminUpdateBlogDto {
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  isPublished?: boolean;
  mdTheme?: string;
  tags?: string[];
}
