export interface UpdateSystemAnnouncementDto {
  /** @maxLength 200 */
  title?: string;
  /** @maxLength 100000 */
  bodyRich?: string;
  imageUrls?: string[];
  sortOrder?: number;
}
