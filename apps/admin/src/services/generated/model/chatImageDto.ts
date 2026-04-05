import type { ChatImageDtoMimeType } from "./chatImageDtoMimeType";

export interface ChatImageDto {
  /** 图片 MIME 类型 */
  mimeType: ChatImageDtoMimeType;
  /**
   * Base64 编码的图片数据（不含 data: 前缀）
   * @maxLength 6000000
   */
  dataBase64: string;
}
