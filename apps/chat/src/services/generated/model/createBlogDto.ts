export interface CreateBlogDto {
  title: string;
  content: string;
  summary: string;
  tags?: string[];
  isPublished?: boolean;
  cover?: string | null;
  mdTheme?: string | null;
}
