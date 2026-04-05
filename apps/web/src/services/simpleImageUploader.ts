import { FileType, SimpleUploader } from '@abner-blog/upload';

/**
 * 创建图片直传实例（逻辑在 @abner-blog/upload 的 SimpleUploader）
 */
export function createSimpleImageUploader(
  imageBusinessPath: string,
  imageMarkdownResponse = false,
): SimpleUploader {
  return new SimpleUploader({
    type: FileType.IMAGE,
    baseUrl: '',
    imageBusinessPath,
    imageMarkdownResponse,
  });
}
