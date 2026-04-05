export type UploadControllerUploadImageParams = {
  /**
   * 传 1 或 true 时返回 Markdown 编辑器格式（success/url/message）
   */
  markdown?: string;
  /**
   * 业务路径，如 common、notes、moments、blogs、avatars
   */
  businessPath?: unknown;
};
