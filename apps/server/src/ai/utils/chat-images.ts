import { BadRequestException } from '@nestjs/common';
import type { ChatImageDto } from '../dto/chat.dto';

export const MAX_CHAT_IMAGE_BYTES = 4 * 1024 * 1024;

export function validateChatImages(images?: ChatImageDto[]): void {
  if (!images?.length) return;
  for (const img of images) {
    const buf = Buffer.from(img.dataBase64, 'base64');
    if (!buf.length || buf.length > MAX_CHAT_IMAGE_BYTES) {
      throw new BadRequestException(
        `单张图片过大或无效，请压缩后重试（最大 ${MAX_CHAT_IMAGE_BYTES / 1024 / 1024}MB）`,
      );
    }
  }
}

export function toHistoryUserText(
  message: string,
  images?: ChatImageDto[],
): string {
  const text = message.trim();
  if (images?.length) {
    const tag = `[图片×${images.length}]`;
    return text ? `${tag} ${text}` : tag;
  }
  return text;
}
